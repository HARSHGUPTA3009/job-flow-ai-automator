import http from 'k6/http';

export const options = {
  vus: 1000,            // concurrent users
  duration: '60s',      // run for 1 minute
};

export default function () {
  const payload = JSON.stringify({
    userId: Math.floor(Math.random() * 100000),
    email: `test${Math.random()}@mail.com`,
  });

  http.post('http://localhost:3000/send-email', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}