import "dotenv/config";
import { pickQuestion } from "../src/services/round.service.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const quiz = await prisma.quiz.findFirst({ include: { questions: true } });
  if (!quiz) throw new Error("No quiz — run npm run seed:quiz first");

  const first = await pickQuestion(quiz.id, []);
  const second = await pickQuestion(quiz.id, [first.id]);
  console.log({
    firstId: first.id,
    secondId: second.id,
    options: first.options.length,
  });
  if (first.id === second.id) throw new Error("usedIds filter failed");
  if (first.options.length !== 4) throw new Error("options length");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
