import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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

async function main(): Promise<void> {
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed admin');
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminUsername = process.env.ADMIN_SEED_USERNAME ?? 'admin_fuelsense';
  const rawRounds = process.env.BCRYPT_SALT_ROUNDS;

  if (!adminEmail) {
    throw new Error('ADMIN_SEED_EMAIL is required to seed admin');
  }

  if (!adminPassword) {
    throw new Error('ADMIN_SEED_PASSWORD is required to seed admin');
  }

  if (!rawRounds) {
    throw new Error('BCRYPT_SALT_ROUNDS is required to seed admin');
  }

  const rounds = Number(rawRounds);
  if (!Number.isFinite(rounds) || rounds < 4) {
    throw new Error('BCRYPT_SALT_ROUNDS must be a number >= 4');
  }

  const saltRounds = Math.floor(rounds);

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: 'ADMIN',
      },
      create: {
        email: adminEmail,
        username: adminUsername,
        passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    console.log('Admin seed complete:', user);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Admin seed failed:', message);
  process.exit(1);
});
