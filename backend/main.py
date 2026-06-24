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

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "scoreplug")
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DB_NAME]

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
OWNER_EMAIL = os.getenv("OWNER_EMAIL", "Cashbullysllc@gmail.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@scoreplug.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeThisNow!2024")

security = HTTPBearer()


# ── Models ──────────────────────────────────────────────
class LeadCreate(BaseModel):
    first_name: str
    email: EmailStr
    phone: str

class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    stage: Optional[str] = None  # lead, onboarded, active, completed, cancelled
    assigned_to: Optional[str] = None  # nasir, partner
    payment_status: Optional[str] = None  # unpaid, onboarding_paid, monthly_active, cancelled
    onboarding_fee_paid: Optional[bool] = None
    monthly_fee_active: Optional[bool] = None
    score_eq_before: Optional[int] = None
    score_ex_before: Optional[int] = None
    score_tu_before: Optional[int] = None
    score_eq_current: Optional[int] = None
    score_ex_current: Optional[int] = None
    score_tu_current: Optional[int] = None
    disputes_sent: Optional[int] = None
    items_removed: Optional[int] = None
    notes: Optional[str] = None
    contacted: Optional[bool] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Helpers ─────────────────────────────────────────────
def serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

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
                </div>
                <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #0a1628;">New Lead: {lead['first_name']}</h2>
                    <p><strong>Email:</strong> {lead['email']}</p>
                    <p><strong>Phone:</strong> {lead['phone']}</p>
                    <p><strong>Time:</strong> {lead['created_at'].strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
            </div>
            """
        })
    except Exception as e:
        print(f"Email error: {e}")


# ── Startup ──────────────────────────────────────────────
@app.on_event("startup")
async def seed_admin():
    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt())
    if not existing:
        await db.admins.insert_one({"email": ADMIN_EMAIL, "password": hashed.decode(), "created_at": datetime.utcnow()})
    else:
        await db.admins.update_one({"email": ADMIN_EMAIL}, {"$set": {"password": hashed.decode()}})
    print(f"✅ Admin ready: {ADMIN_EMAIL}")


# ── Auth ─────────────────────────────────────────────────
@app.post("/api/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    admin = await db.admins.find_one({"email": req.email})
    if not admin or not bcrypt.checkpw(req.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_token({"sub": req.email}))

@app.get("/api/auth/me")
async def me(email: str = Depends(verify_token)):
    return {"email": email}


# ── Leads (public form) ──────────────────────────────────
@app.post("/api/leads", status_code=201)
async def create_lead(lead: LeadCreate):
    existing = await db.leads.find_one({"email": lead.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already submitted")
    doc = {
        "first_name": lead.first_name,
        "email": lead.email,
        "phone": lead.phone,
        "stage": "lead",
        "assigned_to": "unassigned",
        "payment_status": "unpaid",
        "onboarding_fee_paid": False,
        "monthly_fee_active": False,
        "score_eq_before": None,
        "score_ex_before": None,
        "score_tu_before": None,
        "score_eq_current": None,
        "score_ex_current": None,
        "score_tu_current": None,
        "disputes_sent": 0,
        "items_removed": 0,
        "notes": "",
        "contacted": False,
        "created_at": datetime.utcnow()
    }
    result = await db.leads.insert_one(doc)
    doc["_id"] = result.inserted_id
    await send_lead_email(doc)
    return {"message": "Lead captured", "id": str(result.inserted_id)}


# ── Clients/Leads (protected) ────────────────────────────
@app.get("/api/leads")
async def get_leads(email: str = Depends(verify_token)):
    leads = []
    async for lead in db.leads.find().sort("created_at", -1):
        leads.append(serialize(lead))
    return leads

@app.get("/api/leads/{lead_id}")
async def get_lead(lead_id: str, email: str = Depends(verify_token)):
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize(lead)

@app.patch("/api/leads/{lead_id}")
async def update_lead(lead_id: str, update: ClientUpdate, email: str = Depends(verify_token)):
    data = {k: v for k, v in update.dict().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No data provided")
    result = await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Updated"}

@app.patch("/api/leads/{lead_id}/contacted")
async def mark_contacted(lead_id: str, email: str = Depends(verify_token)):
    await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": {"contacted": True}})
    return {"message": "Marked as contacted"}

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str, email: str = Depends(verify_token)):
    result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

@app.get("/api/stats")
async def get_stats(email: str = Depends(verify_token)):
    total = await db.leads.count_documents({})
    contacted = await db.leads.count_documents({"contacted": True})
    active = await db.leads.count_documents({"stage": "active"})
    new_today = await db.leads.count_documents({
        "created_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0)}
    })
    onboarding_paid = await db.leads.count_documents({"onboarding_fee_paid": True})
    monthly_active = await db.leads.count_documents({"monthly_fee_active": True})
    return {
        "total": total,
        "contacted": contacted,
        "active": active,
        "new_today": new_today,
        "onboarding_paid": onboarding_paid,
        "monthly_active": monthly_active
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}
