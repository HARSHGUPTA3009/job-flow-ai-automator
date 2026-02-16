const express = require("express");
const router = express.Router();
const { google } = require("googleapis");

// Middleware

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthorized" });
};


// 👇 Optional GET for debug
router.get("/send", (req, res) => {
  res.status(405).json({ error: "Use POST instead." });
});



router.post("/send", ensureAuthenticated, async (req, res) => {
  const user = req.user;


  if (!user?.tokens?.access_token) {
    return res.status(401).json({ error: "No access token" });
  }

  const { to, subject, body } = req.body;

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
      access_token: user.tokens.access_token,
      refresh_token: user.tokens.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const message = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      `Subject: ${subject}`,
      "",
      body,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Gmail send error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;
