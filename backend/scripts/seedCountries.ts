/**
 * Seeds the `countries` table from seed/countries.json.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "../app/generated/prisma/client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COUNTRIES_SEED_PATH = join(__dirname, "../seed/countries.json");

type CountrySeed = Pick<
  Prisma.CountryCreateManyInput,
  "name" | "capital" | "continent" | "difficulty"
>;

function loadCountrySeeds(): CountrySeed[] {
  const raw = readFileSync(COUNTRIES_SEED_PATH, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array in ${COUNTRIES_SEED_PATH}, got ${typeof parsed}`);
  }

  return parsed as CountrySeed[];
}

async function seedCountries(prisma: PrismaClient): Promise<void> {
  const countries = loadCountrySeeds();
  console.log(`Loaded ${countries.length} countries from ${COUNTRIES_SEED_PATH}`);

  await prisma.$transaction(async (tx) => {
    await tx.country.deleteMany();
    await tx.country.createMany({ data: countries });
  });

  console.log(`Seeded ${countries.length} countries.`);
}

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedCountries(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed countries:", error);
  process.exitCode = 1;

});
