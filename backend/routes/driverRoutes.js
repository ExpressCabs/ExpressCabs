const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

// POST /api/driver/register
router.post('/register', async (req, res) => {
    const { name, email, phone, password, dcNumber, taxiReg, carModel } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password || !dcNumber || !taxiReg || !carModel) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    try {
        // Check if driver already exists (by email or DC number)
        const existingDriver = await prisma.driver.findFirst({
            where: {
                OR: [
                    { email },
                    { dcNumber },
                ],
            },
        });

        if (existingDriver) {
            return res.status(409).json({ error: 'Driver with this email or DC number already exists.' });
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new driver
        const newDriver = await prisma.driver.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                dcNumber,
                taxiReg,
                carModel,
            },
        });

        res.status(201).json({ message: 'Driver registered successfully!', driverId: newDriver.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong on the server.' });
    }
});

// POST /api/driver/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if required fields are present
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find the driver by email
        const driver = await prisma.driver.findUnique({
            where: { email }
        });

        if (!driver) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, driver.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // If password matches, return success and driver info (exclude password)
        res.status(200).json({
            message: 'Login successful.',
            driver: {
                id: driver.id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                dcNumber: driver.dcNumber,
                taxiReg: driver.taxiReg,
                carModel: driver.carModel
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

module.exports = router;
