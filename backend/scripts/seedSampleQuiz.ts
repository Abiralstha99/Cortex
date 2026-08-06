import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  // Use first user if present; otherwise insert a throwaway owner for local smoke only.
  let owner = await prisma.user.findFirst();
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        clerkUserId: "local_seed_owner",
        username: "seed_owner",
        email: "seed_owner@example.com",
      },
    });
  }

  const quiz = await prisma.quiz.create({
    data: {
      ownerId: owner.id,
      title: "Sample Capitals (Phase 2 smoke)",
      sourceType: "text",
      questionCount: 3,
      questions: {
        create: [
          {
            position: 1,
            question: "What is the capital of France?",
            options: ["Lyon", "Paris", "Marseille", "Nice"],
            correctIndex: 1,
            explanation: "Paris is the capital of France.",
          },
          {
            position: 2,
            question: "What is the capital of Japan?",
            options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"],
            correctIndex: 2,
            explanation: "Tokyo is the capital of Japan.",
          },
          {
            position: 3,
            question: "What is the capital of Canada?",
            options: ["Toronto", "Vancouver", "Montreal", "Ottawa"],
            correctIndex: 3,
            explanation: "Ottawa is the capital of Canada.",
          },
        ],
      },
    },
    include: { questions: true },
  });

  console.log(
    JSON.stringify(
      { quizId: quiz.id, questions: quiz.questions.length },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
