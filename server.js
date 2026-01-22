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
  `Subject: ${subject}\r\n` +
  `MIME-Version: 1.0\r\n` +
  `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
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
      text: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>New Enquiry</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">

          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

            <!-- Header -->
            <tr>
              <td style="background:#2c3e50; padding:20px; color:#ffffff;">
                <h2 style="margin:0; font-size:20px;">📩 New Enquiry Received</h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:24px; color:#333333;">
                <p style="font-size:14px; margin-bottom:20px;">
                  Hi Admin,<br /><br />
                  You have received a new enquiry. The details are below:
                </p>

                <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                  <tr>
                    <td style="background:#f8f8f8; font-weight:bold; width:30%;">Name</td>
                    <td>${name}</td>
                  </tr>
                  <tr>
                    <td style="background:#f8f8f8; font-weight:bold;">Phone</td>
                    <td>${phone}</td>
                  </tr>
                  <tr>
                    <td style="background:#f8f8f8; font-weight:bold;">Email</td>
                    <td>${email}</td>
                  </tr>
                  <tr>
                    <td style="background:#f8f8f8; font-weight:bold;">Occasion</td>
                    <td>${occasion}</td>
                  </tr>
                  <tr>
                    <td style="background:#f8f8f8; font-weight:bold;">Budget</td>
                    <td>${budget}</td>
                  </tr>
                  <tr>
                    <td style="background:#f8f8f8; font-weight:bold;">Message</td>
                    <td>${message}</td>
                  </tr>
                </table>

                <p style="margin-top:24px; font-size:14px;">
                  Please follow up with the customer at the earliest.
                </p>

                <p style="font-size:14px; margin-top:30px;">
                  Regards,<br />
                  <strong>Curated Gifting Service</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f0f0f0; padding:12px; text-align:center; font-size:12px; color:#777;">
                This enquiry was submitted via your website.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
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
