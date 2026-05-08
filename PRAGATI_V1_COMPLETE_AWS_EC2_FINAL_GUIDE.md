# PRAGATI v1 Complete

## Final AWS EC2 Deployment Guide for `https://mis.brightbeginings.org`

This guide is for deploying:

- frontend from `PRAGATI_v1_complete\pragati\frontend`
- backend from `PRAGATI_v1_complete\pragati\backend`
- PostgreSQL database on the same EC2 server
- domain: `https://mis.brightbeginings.org`

This also includes replacing and removing the old MIS from `project (8)`.

---

## 1. What You Are Deploying

Your new stack is:

- `Frontend`: Vite + React static build
- `Backend`: Node.js + Express + Prisma
- `Database`: PostgreSQL
- `Reverse Proxy`: Nginx
- `Process Manager`: PM2
- `SSL`: Certbot / Let's Encrypt

Important difference from old `project (8)`:

- old MIS used a different app structure and internal port `9002`
- this PRAGATI app uses:
  - frontend static build via Nginx
  - backend on port `4000`
  - PostgreSQL instead of MongoDB

---

## 2. Important Notes Before Deployment

### 2.1 Prisma setup

This backend has:

- `prisma/schema.prisma`
- `prisma/seed.js`

But it does **not** have a `prisma/migrations` folder.

So for first deployment on EC2:

- use `npx prisma generate`
- use `npx prisma db push`

Do not depend on `npm start` for the first database setup.

### 2.2 Frontend serving

This frontend is a Vite app. In production:

- build it with `npm run build`
- serve the generated `dist` folder with Nginx

Do not run the frontend with PM2 in production.

### 2.3 Cloudflare R2 requirement

The backend upload and report export code uses Cloudflare R2 / S3-compatible storage.

If you do **not** configure:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

then these features may fail:

- child photo uploads
- exported report file uploads

The portal can still run without R2, but upload/report-download features may break.

---

## 3. Pre-Deployment Checklist

Make sure you have:

- EC2 Ubuntu server
- public IP attached
- domain DNS access
- SSH access to the EC2 server
- frontend zip file
- backend zip file
- DB password ready
- JWT secrets ready
- optional R2 credentials ready
- optional AI keys ready
- optional MSG91 credentials ready

---

## 4. Local Preparation

From your local machine, prepare two zip files:

- `frontend.zip` from `PRAGATI_v1_complete\pragati\frontend`
- `backend.zip` from `PRAGATI_v1_complete\pragati\backend`

Do not include:

- `node_modules`
- local `.env`
- `dist`
- temporary logs

---

## 5. Point Domain to EC2

At your DNS provider, create or update:

- Type: `A`
- Name: `mis`
- Value: `YOUR_EC2_PUBLIC_IP`

Wait for DNS propagation before SSL.

---

## 6. Upload Zip Files to EC2

From your local machine:

```bash
scp frontend.zip ubuntu@YOUR_EC2_IP:/home/ubuntu/
scp backend.zip ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

Then connect:

```bash
ssh ubuntu@YOUR_EC2_IP
```

---

## 7. Back Up the Old MIS First

Before changing anything:

```bash
pm2 list
pm2 save
sudo cp -r /etc/nginx/sites-available /etc/nginx/sites-available.backup-$(date +%F-%H%M%S)
sudo cp -r /etc/nginx/sites-enabled /etc/nginx/sites-enabled.backup-$(date +%F-%H%M%S)
```

If old project files are in `/home/ubuntu/mis-deployment`, archive them:

```bash
mv /home/ubuntu/mis-deployment /home/ubuntu/mis-deployment-backup-$(date +%F-%H%M%S)
```

If the old PM2 process is `mis-portal`, stop it:

```bash
pm2 stop mis-portal
pm2 delete mis-portal
pm2 save
```

Do not permanently delete the old project until the new one is working.

---

## 8. Install Required Software on EC2

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx unzip curl ca-certificates gnupg postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Verify:

```bash
node -v
npm -v
psql --version
pm2 -v
```

Recommended: install build/runtime libs for packages like Prisma and Puppeteer support:

```bash
sudo apt install -y build-essential
```

---

## 9. Create New Project Directories

```bash
mkdir -p /home/ubuntu/pragati/backend
mkdir -p /home/ubuntu/pragati/frontend
mkdir -p /var/www/pragati
```

Unzip:

```bash
unzip /home/ubuntu/backend.zip -d /home/ubuntu/pragati/backend
unzip /home/ubuntu/frontend.zip -d /home/ubuntu/pragati/frontend
```

If your zip extracts into one extra nested folder, move into the actual project root before continuing.

---

## 10. Set Up PostgreSQL

Open PostgreSQL shell:

```bash
sudo -u postgres psql
```

Create DB user and DB:

```sql
CREATE USER pragati_user WITH PASSWORD 'CHANGE_THIS_DB_PASSWORD';
CREATE DATABASE pragati_db OWNER pragati_user;
GRANT ALL PRIVILEGES ON DATABASE pragati_db TO pragati_user;
\q
```

---

## 11. Configure Backend

Go to backend folder:

```bash
cd /home/ubuntu/pragati/backend
```

Install dependencies:

```bash
npm install
```

Create backend `.env`:

```bash
nano .env
```

Use this production template:

```env
DATABASE_URL="postgresql://pragati_user:CHANGE_THIS_DB_PASSWORD@127.0.0.1:5432/pragati_db"

REDIS_URL=""

JWT_SECRET="GENERATE_LONG_RANDOM_SECRET_1"
JWT_REFRESH_SECRET="GENERATE_LONG_RANDOM_SECRET_2"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="30d"

ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
GEMINI_API_KEY=""

R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="pragati-files"
R2_PUBLIC_URL=""

MSG91_AUTH_KEY=""
MSG91_SENDER_ID="PRAGTI"
MSG91_TEMPLATE_ID=""

FRONTEND_URL="https://mis.brightbeginings.org"
PORT=4000
NODE_ENV="production"
```

Generate JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Which env values are required immediately

Required for app startup:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `PORT`
- `NODE_ENV`

Required for file uploads and exported reports:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

Optional for AI:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Optional for SMS:

- `MSG91_AUTH_KEY`
- `MSG91_SENDER_ID`
- `MSG91_TEMPLATE_ID`

---

## 12. Initialize Prisma Database

Still in backend folder:

```bash
cd /home/ubuntu/pragati/backend
npx prisma generate
npx prisma db push
npm run db:seed
```

This will:

- create the PostgreSQL tables from `schema.prisma`
- seed locations and staff users

### First login credentials from seed

- email: `admin@brightbeginnings.org`
- password: `Pragati@Admin2025!`

Change this password immediately after first login.

---

## 13. Start Backend with PM2

Because the current `npm start` script uses `prisma migrate deploy`, and there are no migration files, use this command:

```bash
cd /home/ubuntu/pragati/backend
pm2 start "node src/app.js" --name pragati-backend
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Check logs:

```bash
pm2 logs pragati-backend
```

Check health:

```bash
curl http://127.0.0.1:4000/health
```

Expected response should contain:

- `status: "ok"`
- `version: "1.0.0"`

---

## 14. Configure Frontend

Go to frontend folder:

```bash
cd /home/ubuntu/pragati/frontend
```

Install dependencies:

```bash
npm install
```

Create production env:

```bash
nano .env.production
```

Add:

```env
VITE_API_URL=https://mis.brightbeginings.org/api
```

Build frontend:

```bash
npm run build
```

Copy build output to Nginx web root:

```bash
sudo rm -rf /var/www/pragati/*
sudo cp -r dist/* /var/www/pragati/
sudo chown -R www-data:www-data /var/www/pragati
```

---

## 15. Configure Nginx

Create new site:

```bash
sudo nano /etc/nginx/sites-available/mis.brightbeginings.org
```

Use this config:

```nginx
server {
    listen 80;
    server_name mis.brightbeginings.org;

    root /var/www/pragati;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:4000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/mis.brightbeginings.org /etc/nginx/sites-enabled/mis.brightbeginings.org
sudo nginx -t
sudo systemctl reload nginx
```

If the old MIS Nginx file is still enabled and conflicts, remove the old symlink from `sites-enabled`.

---

## 16. Install SSL Certificate

Install certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Issue certificate:

```bash
sudo certbot --nginx -d mis.brightbeginings.org
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

After certbot finishes, Nginx will be updated for HTTPS automatically.

---

## 17. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 18. Full Verification Checklist

### 18.1 Backend

```bash
curl http://127.0.0.1:4000/health
curl https://mis.brightbeginings.org/health
```

### 18.2 Frontend

Open:

- `https://mis.brightbeginings.org`

### 18.3 Login

Login with:

- `admin@brightbeginnings.org`
- `Pragati@Admin2025!`

### 18.4 PM2

```bash
pm2 list
pm2 logs pragati-backend --lines 100
```

### 18.5 Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 19. Post-Deployment Tasks

Immediately after first login:

1. change the admin password
2. create real production users
3. verify dashboard loads
4. verify child registration works
5. verify IEP creation works
6. verify report generation works
7. verify file upload works if R2 is configured
8. verify AI features work if API keys are configured
9. verify SMS features work if MSG91 is configured

---

## 20. Safe Removal of Old `project (8)` MIS

Only after the new PRAGATI portal is working correctly:

```bash
pm2 list
```

Confirm the old process is gone.

If old project folders still exist, remove them only after you are sure:

```bash
rm -rf /home/ubuntu/mis-deployment-backup-OLD_TIMESTAMP
```

Do this only when you no longer need rollback.

If you want to keep a rollback option, leave the backup folder in place for a few days.

---

## 21. Common Problems and Fixes

### Problem: `npm start` fails with Prisma migrate deploy

Cause:

- no `prisma/migrations` folder exists

Fix:

- use `npx prisma generate`
- use `npx prisma db push`
- start backend with `node src/app.js`

### Problem: frontend loads but login/API fails

Cause:

- `VITE_API_URL` is wrong
- Nginx `/api/` proxy is wrong
- backend not running

Fix:

- confirm `.env.production`
- rebuild frontend
- check `curl http://127.0.0.1:4000/health`

### Problem: CORS error

Cause:

- `FRONTEND_URL` not set to `https://mis.brightbeginings.org`

Fix:

- update backend `.env`
- restart backend:

```bash
pm2 restart pragati-backend
```

### Problem: uploads or report downloads fail

Cause:

- Cloudflare R2 env vars are missing or wrong

Fix:

- fill `R2_*` values in backend `.env`
- restart backend

### Problem: SSL fails

Cause:

- DNS does not point to EC2 IP yet

Fix:

- verify `mis.brightbeginings.org` resolves to your EC2 public IP
- retry certbot

---

## 22. Final Command Summary

### Backend first setup

```bash
cd /home/ubuntu/pragati/backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
pm2 start "node src/app.js" --name pragati-backend
pm2 save
```

### Frontend first setup

```bash
cd /home/ubuntu/pragati/frontend
npm install
npm run build
sudo cp -r dist/* /var/www/pragati/
```

### Nginx and SSL

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d mis.brightbeginings.org
```

---

## 23. Final Recommendation

Use this order exactly:

1. back up old MIS
2. upload zip files
3. install Node, Nginx, PostgreSQL, PM2
4. stop old PM2 app
5. configure PostgreSQL
6. configure backend `.env`
7. run Prisma setup and seed
8. start backend with PM2
9. configure frontend `.env.production`
10. build frontend
11. copy frontend `dist` to `/var/www/pragati`
12. configure Nginx
13. enable SSL
14. test portal
15. change default admin password
16. remove old project only after successful verification
