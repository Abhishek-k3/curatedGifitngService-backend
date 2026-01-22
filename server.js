console.log('ALL ENV KEYS:', Object.keys(process.env));

import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

console.log('Has refresh token:', !!process.env.GMAIL_REFRESH_TOKEN);
console.log({
  hasClientId: !!process.env.GMAIL_CLIENT_ID,
  hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
  hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN
});
oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function sendMail({ to, subject, text }) {
  const rawMessage = Buffer.from(
    `From: ${process.env.GMAIL_SENDER}\r\n` +
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

app.get('/', (_, res) => {
  res.send('Backend is running');
});

app.post('/send-enquiry', async (req, res) => {
  const { name, phone, email, occasion, budget, message } = req.body;

  try {
    await sendMail({
      to: process.env.GMAIL_SENDER,
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
    console.error(err);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
