# One-to-One Media Buying Course — Landing + Backend

This repository provides a modern landing page and a small Node/Express backend to collect applications for Hesham Hamdy's one-to-one Media Buying course.

Features:
- Attractive landing page with curriculum and about section.
- "Enroll Now" CTA opens an in-page application form (modal).
- Form collects: name, email, phone, experience, goals, platform interest (Snapchat, Meta, TikTok, Google), timezone (auto-detected), preferred times, and consent.
- Submissions stored in a SQLite database.
- Sends confirmation email to applicant and optional notification to admin email.
- Admin view (`/admin`) to review and export applications (protected by Basic Auth).

Quick start
1. Install dependencies:
   npm install

2. Create a `.env` file with the following values (example):
   PORT=3000
   DATABASE_FILE=./data.db
   ADMIN_USER=admin
   ADMIN_PASS=changeme
   FROM_EMAIL="no-reply@yourdomain.com"
   ADMIN_EMAIL="you@yourdomain.com"

   SMTP settings (to send emails):
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=smtp_user
   SMTP_PASS=smtp_password
   SMTP_SECURE=false

3. Start the server:
   npm start

4. Open http://localhost:3000 to view the landing page.
   Go to http://localhost:3000/admin (you will be prompted for the admin username/password).

Notes and customization ideas
- Styling is lightweight; replace fonts and colors to match your brand.
- Replace FROM_EMAIL/ADMIN_EMAIL and SMTP settings with your mail provider (SendGrid, Mailgun, or SMTP).
- For production, consider:
  - Using a managed database (Postgres) instead of SQLite.
  - Enforcing HTTPS and stronger auth for admin (OAuth or session-based).
  - Rate-limiting submissions and adding CAPTCHA.
  - Deploying to a platform like Render, Vercel (front-end) + Railway/Heroku (backend).

What's next (done for you)
- I implemented the landing page, modal application form with timezone auto-detection, server endpoints to store and retrieve applications, and email notifications. The admin view allows exporting CSVs.

If you'd like, I can:
- Add password hashing and session-based admin login.
- Integrate a real email provider template (HTML emails).
- Add analytics, A/B hero variations, or a pricing/prioritization flow.
- Prepare a Dockerfile and deployment instructions for production.
