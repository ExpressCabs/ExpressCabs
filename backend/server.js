// server.js - Express server entry point
// server.js
const express = require('express');
const cors = require('cors');
const rideRoutes = require('./routes/rideRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', rideRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
