import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { normalizeBrand } from '../src/modules/maintenance/domain/services/brand-normalizer';

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

/**
 * Rewrites maintenance_records.parts_brand to its canonical spelling.
 * Prints what would change and writes nothing unless run with --apply.
 */
async function main(): Promise<void> {
  const root = process.cwd();
  const apply = process.argv.includes('--apply');
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to normalize brands');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const rows = await prisma.maintenanceRecord.findMany({
      where: { partsBrand: { not: null } },
      select: { id: true, partsBrand: true },
    });

    const changes = new Map<string, { to: string | null; ids: number[] }>();
    for (const { id, partsBrand } of rows) {
      const to = normalizeBrand(partsBrand);
      if (to === partsBrand) {
        continue;
      }
      const key = `${partsBrand}\u0000${to}`;
      const entry = changes.get(key) ?? { to, ids: [] };
      entry.ids.push(id);
      changes.set(key, entry);
    }

    for (const [key, { to, ids }] of changes) {
      const from = key.split('\u0000')[0];
      console.log(`${JSON.stringify(from)} -> ${JSON.stringify(to)}  (${ids.length} rows)`);
      if (apply) {
        await prisma.maintenanceRecord.updateMany({
          where: { id: { in: ids } },
          data: { partsBrand: to },
        });
      }
    }

    const total = [...changes.values()].reduce((sum, { ids }) => sum + ids.length, 0);
    console.log(
      apply
        ? `Updated ${total} of ${rows.length} rows with a brand.`
        : `Dry run: ${total} of ${rows.length} rows with a brand would change. Re-run with --apply to write.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
