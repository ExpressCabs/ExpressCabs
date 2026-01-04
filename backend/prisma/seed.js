const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('@dap2kE4yAGqqqhHnKa', 10);

    await prisma.admin.create({
        data: {
            email: 'PrimeCabsmelbourne@gmail.com',
            password: hashedPassword,
            name: 'Harwinder Singh',
        },
    });

    console.log('✅ Admin seeded successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
