const express = require('express');
const router = express.Router();

const placementRoutes = require('./placement');

router.use('/placement', placementRoutes);

module.exports = router;
