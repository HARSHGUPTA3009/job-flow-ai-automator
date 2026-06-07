const keys = [
  process.env.GROQ_API_KEY1,
  process.env.GROQ_API_KEY2,
  process.env.GROQ_API_KEY3
];

let i = 0;

function getKey() {
  const key = keys[i];
  i = (i + 1) % keys.length;
  return key;
}

module.exports = { getKey };