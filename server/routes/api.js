// In /opt/render/project/src/server/routes/api.js
const express = require('express');
const router = express.Router();

// Import placement routes
const placementRoutes = require('./placement');

// Use placement routes
router.use('/placement', placementRoutes);

// ... your other routes ...

module.exports = router;