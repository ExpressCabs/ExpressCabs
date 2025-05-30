// server.js - Express server entry point
// server.js
const express = require('express');
const cors = require('cors');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes')

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', rideRoutes);
app.use('/api/driver', driverRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
