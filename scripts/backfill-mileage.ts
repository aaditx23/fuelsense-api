import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { reserveCycleTotals } from '../src/common/fuel/mileage-calculator';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

/** Fills user_bikes.mileage_distance/mileage_fuel from existing fuel records. */
async function main(): Promise<void> {
  const root = process.cwd();
  const dryRun = process.argv.includes('--dry-run');
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to backfill mileage');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const userBikes = await prisma.userBike.findMany({ select: { id: true } });
    let updated = 0;

    for (const { id } of userBikes) {
      const records = await prisma.fuelRecord.findMany({
        where: { userBikeId: id },
        select: {
          userBikeId: true,
          entryType: true,
          odometerAtReserve: true,
          fuelLiter: true,
          createdAt: true,
        },
      });
      const totals = reserveCycleTotals(records).get(id);
      const distance = totals?.distance ?? 0;
      const fuel = totals?.fuel ?? 0;

      console.log(`user_bike ${id}: distance=${distance} fuel=${fuel}`);
      if (!dryRun) {
        await prisma.userBike.update({
          where: { id },
          data: { mileageDistance: distance, mileageFuel: fuel },
        });
        updated++;
      }
    }

    console.log(dryRun ? 'Dry run: nothing written.' : `Updated ${updated} user bikes.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
