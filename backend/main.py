from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
import jwt
import bcrypt
import os
import resend
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Score Plug API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "scoreplug")
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DB_NAME]

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "changeme-use-a-real-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Resend
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
OWNER_EMAIL = os.getenv("OWNER_EMAIL", "Cashbullysllc@gmail.com")

# Admin creds
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@scoreplug.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeThisNow!2024")

security = HTTPBearer()


# ── Models ──────────────────────────────────────────────
class LeadCreate(BaseModel):
    first_name: str
    email: EmailStr
    phone: str

class LeadOut(BaseModel):
    id: str
    first_name: str
    email: str
    phone: str
    contacted: bool
    created_at: datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Helpers ─────────────────────────────────────────────
def serialize_lead(lead: dict) -> dict:
    lead["id"] = str(lead["_id"])
    del lead["_id"]
    return lead

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def send_lead_email(lead: dict):
    if not RESEND_API_KEY:
        print("⚠️  No RESEND_API_KEY set — skipping email notification")
        return
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": "Score Plug <onboarding@resend.dev>",
            "to": [OWNER_EMAIL],
            "subject": f"🎯 New Lead: {lead['first_name']}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0a1628; padding: 24px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #22c55e; margin: 0;">Score Plug</h1>
                    <p style="color: #94a3b8; margin: 4px 0 0;">New Lead Notification</p>
                </div>
                <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #0a1628; margin-top: 0;">New Lead Submitted</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #64748b; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: bold; color: #0a1628;">{lead['first_name']}</td></tr>
                        <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0; color: #0ea5e9;">{lead['email']}</td></tr>
                        <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0; color: #0a1628;">{lead['phone']}</td></tr>
                        <tr><td style="padding: 8px 0; color: #64748b;">Submitted</td><td style="padding: 8px 0; color: #0a1628;">{lead['created_at'].strftime('%B %d, %Y at %I:%M %p')}</td></tr>
                    </table>
                    <div style="margin-top: 20px; padding: 16px; background: #0a1628; border-radius: 8px; text-align: center;">
                        <p style="color: #22c55e; margin: 0; font-weight: bold;">Log in to your dashboard to manage this lead</p>
                    </div>
                </div>
            </div>
            """
        })
        print(f"✅ Email sent to {OWNER_EMAIL}")
    except Exception as e:
        print(f"❌ Email error: {e}")


# ── Startup: seed admin ──────────────────────────────────
@app.on_event("startup")
async def seed_admin():
    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    if not existing:
        hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt())
        await db.admins.insert_one({
            "email": ADMIN_EMAIL,
            "password": hashed.decode(),
            "created_at": datetime.utcnow()
        })
        print(f"✅ Admin seeded: {ADMIN_EMAIL}")
    else:
        # Update password if changed
        hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt())
        await db.admins.update_one({"email": ADMIN_EMAIL}, {"$set": {"password": hashed.decode()}})
        print(f"✅ Admin ready: {ADMIN_EMAIL}")


# ── Auth Routes ──────────────────────────────────────────
@app.post("/api/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    admin = await db.admins.find_one({"email": req.email})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": req.email})
    return TokenResponse(access_token=token)

@app.get("/api/auth/me")
async def me(email: str = Depends(verify_token)):
    return {"email": email}


# ── Lead Routes ──────────────────────────────────────────
@app.post("/api/leads", status_code=201)
async def create_lead(lead: LeadCreate):
    existing = await db.leads.find_one({"email": lead.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already submitted")
    doc = {
        "first_name": lead.first_name,
        "email": lead.email,
        "phone": lead.phone,
        "contacted": False,
        "created_at": datetime.utcnow()
    }
    result = await db.leads.insert_one(doc)
    doc["_id"] = result.inserted_id
    await send_lead_email(doc)
    return {"message": "Lead captured successfully", "id": str(result.inserted_id)}

@app.get("/api/leads")
async def get_leads(email: str = Depends(verify_token)):
    leads = []
    async for lead in db.leads.find().sort("created_at", -1):
        leads.append(serialize_lead(lead))
    return leads

@app.patch("/api/leads/{lead_id}/contacted")
async def mark_contacted(lead_id: str, email: str = Depends(verify_token)):
    result = await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {"contacted": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Marked as contacted"}

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str, email: str = Depends(verify_token)):
    result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}

@app.get("/api/stats")
async def get_stats(email: str = Depends(verify_token)):
    total = await db.leads.count_documents({})
    contacted = await db.leads.count_documents({"contacted": True})
    new_today = await db.leads.count_documents({
        "created_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
    })
    return {"total": total, "contacted": contacted, "new_today": new_today}

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Score Plug API"}
