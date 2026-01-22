import 'dotenv/config'; // 👈 loads .env locally

import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();

/**
 * ================================
 * MIDDLEWARE
 * ================================
 */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

/**
 * ================================
 * CONFIG (ENV ONLY)
 * ================================
 */
const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_SENDER
} = process.env;

// 🔍 Debug (remove later if you want)
console.log({
  hasClientId: !!GMAIL_CLIENT_ID,
  hasClientSecret: !!GMAIL_CLIENT_SECRET,
  hasRefreshToken: !!GMAIL_REFRESH_TOKEN,
  hasSender: !!GMAIL_SENDER
});

/**
 * ================================
 * GMAIL AUTH
 * ================================
 */
const oAuth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({
  refresh_token: GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function sendMail({ to, subject, text }) {
  const rawMessage = Buffer.from(
    `From: ${GMAIL_SENDER}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n\r\n` +
    text
  )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: rawMessage }
  });
}

/**
 * ================================
 * ROUTES
 * ================================
 */
app.get('/', (_, res) => {
  res.send('Backend is running');
});

app.post('/send-enquiry', async (req, res) => {
  const { name, phone, email, occasion, budget, message } = req.body;

  try {
    await sendMail({
      to: GMAIL_SENDER,
      subject: `New Enquiry from ${name}`,
      text: `
Name: ${name}
Phone: ${phone}
Email: ${email}
Occasion: ${occasion}
Budget: ${budget}
Message: ${message}
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('MAIL ERROR:', err);
    res.status(500).json({ success: false });
  }
});

/**
 * ================================
 * SERVER
 * ================================
 */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
