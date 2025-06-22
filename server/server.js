const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors({
  origin: process.env.CLIENT_URL, 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());


app.use("/gmail", require("./routes/gmail"));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));


app.get('/', (req, res) => {
  res.json({ message: 'AutoJob Flow API Server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
