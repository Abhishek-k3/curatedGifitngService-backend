import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();

// ✅ Explicit CORS config
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// ✅ Explicitly handle preflight
app.options('*', cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.post('/send-enquiry', async (req, res) => {
  const { name, phone, email, occasion, budget, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // REQUIRED for port 465
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `New Enquiry from ${name}`,
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Occasion:</b> ${occasion}</p>
        <p><b>Budget:</b> ${budget}</p>
        <p><b>Message:</b> ${message}</p>
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
