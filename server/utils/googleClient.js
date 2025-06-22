const { google } = require("googleapis");

const createGmailClient = (tokens) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oAuth2Client });
};

module.exports = createGmailClient;
