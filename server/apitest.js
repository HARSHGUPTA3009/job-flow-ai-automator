require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'hello'
          }
        ]
      },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY1}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(res.data.choices[0].message.content);
  } catch (err) {
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);
    console.log("MESSAGE:", err.message);
    console.log(process.env.GROQ_API_KEY1.length);
  }
})();