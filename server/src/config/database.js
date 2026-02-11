const { PrismaClient } = require('@prisma/client');

// Strip channel_binding from DATABASE_URL as it's incompatible
// with Neon's PgBouncer connection pooler used by Prisma
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL
    .replace(/([?&])channel_binding=[^&]*&?/g, '$1')
    .replace(/[?&]$/, '');
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
