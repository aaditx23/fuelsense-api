import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

type SeedBike = {
  brand: string;
  model: string;
  engineCc: number;
  modelYear: number;
  fuelType: 'PETROL' | 'DIESEL' | 'OCTANE';
  expectedMileage: number;
  tankCapacity: number;
  reserveCapacity?: number;
  image?: string;
};

const FUEL_TYPES = ['PETROL', 'DIESEL', 'OCTANE'];

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
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

function loadBikes(root: string): SeedBike[] {
  const file = path.join(root, 'scripts', 'data', 'bikes.json');
  const bikes = JSON.parse(fs.readFileSync(file, 'utf8')) as SeedBike[];

  const seen = new Set<string>();
  for (const bike of bikes) {
    const label = `${bike.brand} ${bike.model} (${bike.engineCc}cc, ${bike.modelYear})`;
    const key = [bike.brand, bike.model, bike.engineCc, bike.modelYear].join('|');

    if (seen.has(key)) {
      throw new Error(`Duplicate bike variant in bikes.json: ${label}`);
    }
    seen.add(key);

    if (!FUEL_TYPES.includes(bike.fuelType)) {
      throw new Error(`Invalid fuelType for ${label}: ${bike.fuelType}`);
    }
    if (!(bike.expectedMileage > 0) || !(bike.tankCapacity > 0)) {
      throw new Error(`expectedMileage and tankCapacity must be > 0 for ${label}`);
    }
  }

  return bikes;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const dryRun = process.argv.includes('--dry-run');
  const bikes = loadBikes(root);

  if (dryRun) {
    console.log(`Dry run: ${bikes.length} bikes validated, nothing written.`);
    return;
  }

  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed bikes');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    let created = 0;
    let updated = 0;

    for (const bike of bikes) {
      const where = {
        brand_model_engineCc_modelYear: {
          brand: bike.brand,
          model: bike.model,
          engineCc: bike.engineCc,
          modelYear: bike.modelYear,
        },
      };

      const existing = await prisma.bike.findUnique({ where, select: { id: true } });

      // On re-run, refresh specs and re-activate, but never overwrite
      // reserveCapacity/image an admin may have filled in since.
      await prisma.bike.upsert({
        where,
        update: {
          fuelType: bike.fuelType,
          expectedMileage: bike.expectedMileage,
          tankCapacity: bike.tankCapacity,
          isActive: true,
        },
        create: {
          brand: bike.brand,
          model: bike.model,
          engineCc: bike.engineCc,
          modelYear: bike.modelYear,
          fuelType: bike.fuelType,
          expectedMileage: bike.expectedMileage,
          tankCapacity: bike.tankCapacity,
          reserveCapacity: bike.reserveCapacity ?? null,
          image: bike.image ?? null,
          isActive: true,
        },
      });

      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
    }

    console.log(`Bike seed complete: ${created} created, ${updated} updated (${bikes.length} total).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Bike seed failed:', message);
  process.exit(1);
});
