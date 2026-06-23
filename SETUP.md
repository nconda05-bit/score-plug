# Score Plug — Setup Guide

## Step 1: Backend Setup

```bash
cd backend

# Create your .env file
cp .env.example .env
nano .env   # fill in your values

# Generate a secure SECRET_KEY (run this and paste the output into .env)
python3 -c "import secrets; print(secrets.token_hex(32))"

# Install dependencies
pip3 install -r requirements.txt

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Step 2: Frontend Setup

```bash
cd frontend

# Create your .env file
cp .env.example .env
nano .env   # set VITE_API_URL to your VPS IP or domain

# Install dependencies
npm install

# Build for production
npm run build
# This creates a /dist folder — serve this with nginx
```

## Step 3: Nginx Config (VPS)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /var/www/scoreplug/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 4: Keep Backend Running (PM2)

```bash
npm install -g pm2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name scoreplug-api
pm2 save
pm2 startup
```

## Admin Login
- URL: yourdomain.com/admin/login
- Email: admin@scoreplug.com
- Password: whatever you set in ADMIN_PASSWORD in .env

## Your Keys Checklist
- [ ] MONGODB_URL — Atlas connection string with your password
- [ ] SECRET_KEY — generated with python3 secrets command
- [ ] RESEND_API_KEY — from resend.com
- [ ] OWNER_EMAIL — Cashbullysllc@gmail.com (already set)
- [ ] ADMIN_PASSWORD — change from default!
