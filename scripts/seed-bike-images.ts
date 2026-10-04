import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

type SeedImage = {
  id: number;
  image: string;
};

const DATA_URI_PREFIX = /^data:image\/[a-zA-Z+.-]+;base64,/;

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

/**
 * The app renders `base64Decode(bike.image)` on the raw string, so the
 * `data:image/...;base64,` prefix must not be stored.
 */
function toRawBase64(image: string): string {
  return image.replace(DATA_URI_PREFIX, '');
}

function loadImages(root: string): SeedImage[] {
  const file = path.join(root, 'scripts', 'data', 'bike_images.json');
  const entries = JSON.parse(fs.readFileSync(file, 'utf8')) as SeedImage[];

  const seen = new Set<number>();
  return entries.map((entry) => {
    if (!Number.isInteger(entry.id) || entry.id < 1) {
      throw new Error(`Invalid bike id in bike_images.json: ${entry.id}`);
    }
    if (seen.has(entry.id)) {
      throw new Error(`Duplicate bike id in bike_images.json: ${entry.id}`);
    }
    seen.add(entry.id);

    const image = toRawBase64(entry.image ?? '');
    if (image.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      throw new Error(`Bike ${entry.id}: image is not valid base64`);
    }

    return { id: entry.id, image };
  });
}

async function main(): Promise<void> {
  const root = process.cwd();
  const dryRun = process.argv.includes('--dry-run');
  const images = loadImages(root);

  if (dryRun) {
    const kb = Math.round(images.reduce((sum, i) => sum + i.image.length, 0) / 1024);
    console.log(`Dry run: ${images.length} images validated (~${kb} KB base64), nothing written.`);
    return;
  }

  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed bike images');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.bike.findMany({
      where: { id: { in: images.map((i) => i.id) } },
      select: { id: true, brand: true, model: true },
    });
    const existingIds = new Set(existing.map((b) => b.id));

    const missing = images.filter((i) => !existingIds.has(i.id)).map((i) => i.id);
    if (missing.length > 0) {
      console.warn(`No bike with id ${missing.join(', ')} — skipped.`);
    }

    let updated = 0;
    for (const { id, image } of images) {
      if (!existingIds.has(id)) {
        continue;
      }
      await prisma.bike.update({ where: { id }, data: { image } });
      updated += 1;
    }

    console.log(`Bike image seed complete: ${updated} updated, ${missing.length} skipped.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Bike image seed failed:', message);
  process.exit(1);
});
