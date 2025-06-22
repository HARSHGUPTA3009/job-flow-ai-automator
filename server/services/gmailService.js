const createGmailClient = require("../utils/googleClient");

const encodeMessage = (to, subject, body) => {
  const str = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\n");

  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const sendEmail = async (tokens, { to, subject, body }) => {
  const gmail = createGmailClient(tokens);
  const raw = encodeMessage(to, subject, body);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
    },
  });

  return res.data;
};

module.exports = sendEmail;
