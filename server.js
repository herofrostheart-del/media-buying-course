// A minimal Express server that stores applications in SQLite and sends emails.
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const helmet = require('helmet');

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data.db');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || ''; // admin notification
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    experience TEXT,
    goals TEXT,
    platforms TEXT,
    timezone TEXT,
    preferred_times TEXT,
    consent INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Configure mailer (SMTP settings via env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

// Basic helper to require admin basic auth for admin endpoints
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authorization required');
  }
  const token = authHeader.split(' ')[1] || '';
  const credentials = Buffer.from(token, 'base64').toString();
  const [user, pass] = credentials.split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Invalid credentials');
}

// API: submit application
app.post('/api/apply', async (req, res) => {
  try {
    const {
      name, email, phone, experience, goals,
      platforms = [], timezone, preferred_times = [], consent
    } = req.body;

    if (!name || !email || !consent) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: name, email, consent' });
    }

    const platformsStr = JSON.stringify(platforms);
    const preferredStr = JSON.stringify(preferred_times);
    const consentInt = consent ? 1 : 0;

    const stmt = db.prepare(`INSERT INTO applications
      (name, email, phone, experience, goals, platforms, timezone, preferred_times, consent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    await new Promise((resolve, reject) => {
      stmt.run(name, email, phone || '', experience || '', goals || '', platformsStr, timezone || '', preferredStr, consentInt, function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
    stmt.finalize();

    // Send confirmation email to the applicant
    const mailToApplicant = {
      from: FROM_EMAIL,
      to: email,
      subject: `Thanks for applying — Media Buying Course (Hesham Hamdy)`,
      text: `Hi ${name},

Thank you for applying to the one-to-one Media Buying course presented by Hesham Hamdy.
We received your application and will contact you soon to schedule the session.

Summary:
- Platforms of interest: ${platforms.join(', ') || 'None'}
- Preferred times: ${Array.isArray(preferred_times) ? preferred_times.join(', ') : preferred_times}

Best regards,
Hesham Hamdy
`
    };

    // Send notification to admin if admin email is configured
    const mailToAdmin = ADMIN_EMAIL ? {
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Course Application from ${name}`,
      text: `New applicant:
Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Experience: ${experience || 'N/A'}
Platforms: ${platforms.join(', ')}
Timezone: ${timezone || 'N/A'}
Preferred times: ${Array.isArray(preferred_times) ? preferred_times.join(', ') : preferred_times}
Goals: ${goals || ''}
`
    } : null;

    // Try sending mails if transporter is configured; otherwise continue silently
    if (transporter && transporter.options && transporter.options.host) {
      try {
        await transporter.sendMail(mailToApplicant);
        if (mailToAdmin) await transporter.sendMail(mailToAdmin);
      } catch (mailErr) {
        console.error('Failed to send email(s):', mailErr);
        // continue; email failure shouldn't break submission
      }
    } else {
      console.warn('SMTP not configured; skipping sending emails.');
    }

    return res.json({ ok: true, message: 'Application received' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// API: get applications (admin only)
app.get('/api/applications', basicAuth, (req, res) => {
  db.all(`SELECT id, name, email, phone, experience, goals, platforms, timezone, preferred_times, consent, created_at FROM applications ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: 'DB error' });
    // parse JSON fields before returning
    const parsed = rows.map(r => ({
      ...r,
      platforms: (() => { try { return JSON.parse(r.platforms); } catch { return []; } })(),
      preferred_times: (() => { try { return JSON.parse(r.preferred_times); } catch { return []; } })()
    }));
    res.json({ ok: true, applications: parsed });
  });
});

// Serve admin HTML (protected client-side fetch will also require basic auth)
app.get('/admin', basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});