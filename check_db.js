const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true }
  });
  console.log('--- Users ---');
  console.log(users);

  const bikes = await prisma.bike.findMany({
    select: { id: true, brand: true, model: true }
  });
  console.log('--- Bikes ---');
  console.log(bikes);

  const userBikes = await prisma.userBike.findMany({
    include: {
      user: { select: { username: true } },
      bike: { select: { brand: true, model: true } }
    }
  });
  console.log('--- UserBikes ---');
  console.log(userBikes);

  const parts = await prisma.part.findMany();
  console.log('--- Parts ---');
  console.log(parts);

  const maintenanceRecords = await prisma.maintenanceRecord.findMany();
  console.log('--- Maintenance Records ---');
  console.log(maintenanceRecords);

  const fuelRecords = await prisma.fuelRecord.findMany();
  console.log('--- Fuel Records ---');
  console.log(fuelRecords);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
