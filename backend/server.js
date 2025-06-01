// server.js - Express server entry point
// server.js
const express = require('express');
const cors = require('cors');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/users', userRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
