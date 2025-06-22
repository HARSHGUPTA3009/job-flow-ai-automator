const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ CORS for frontend
app.use(cors({
  origin: process.env.CLIENT_URL, // http://localhost:8083
  credentials: true               // Allow cookies
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,          // false for local dev
    sameSite: 'lax',        // ensures cookie is sent cross-origin
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ✅ Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.get('/', (req, res) => {
  res.json({ message: 'AutoJob Flow API Server is running!' });
});

app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
