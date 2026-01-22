import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();

/**
 * ================================
 * CONFIG TOGGLE (TEMPORARY)
 * ================================
 * true  → use values from this file (TESTING ONLY)
 * false → use Railway environment variables (PRODUCTION)
 */
const USE_REPO_ENV = true;

/**
 * ================================
 * CONFIG SOURCE
 * ================================
 */
const config = USE_REPO_ENV
  ? {
      clientId: "922023383895-kfpnh3ebuft9ub243l7osmnm9miremaq.apps.googleusercontent.com",
      clientSecret: "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",
      refreshToken: "1//04EvaILdtx_wDCgYIARAAGAQSNwF-L9IrikIJjKcW25EjYuaSzm5yD81k8WznYsd3j2Fbx-2uxQUubFmjsf6x1-6sJ0jOSOwPcJ8",
      sender: 'abhisheku3u@gmail.com'
    }
  : {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      sender: process.env.GMAIL_SENDER
    };

// 🔍 Debug (remove later)
console.log({
  hasClientId: !!config.clientId,
  hasClientSecret: !!config.clientSecret,
  hasRefreshToken: !!config.refreshToken,
  usingRepoEnv: USE_REPO_ENV
});

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
 * GMAIL AUTH
 * ================================
 */
const oAuth2Client = new google.auth.OAuth2(
  config.clientId,
  config.clientSecret,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({
  refresh_token: config.refreshToken
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function sendMail({ to, subject, text }) {
  const rawMessage = Buffer.from(
    `From: ${config.sender}\r\n` +
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
      to: config.sender,
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
