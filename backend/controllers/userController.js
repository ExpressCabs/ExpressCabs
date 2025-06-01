// controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.registerUser = async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ message: 'Name, phone, and password are required' });
    }

    try {
        const existing = await prisma.user.findUnique({ where: { phone } });
        if (existing) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        const newUser = await prisma.user.create({
            data: {
                name,
                phone,
                email,
                password, // hash in production!
            },
        });

        res.status(201).json({ message: 'User registered', userId: newUser.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) {
        return res.status(401).json({ message: 'Incorrect password' });
    }

    res.json({ user });
};
