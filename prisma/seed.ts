import { PrismaClient } from "@prisma/client";
const userData = [
  {
    name: "Jane",
    posts: {
      create: [
        {
          title: "First Post",
          content: "Hello, World!",
        },
      ],
    },
  },
  {
    name: "Joe",
    posts: {
      create: [
        {
          title: "Second Post",
          content: "Hello, Journal!",
        },
      ],
    },
  },
];

async function seed() {
  const prisma = new PrismaClient();

  try {
    for (const user of userData) {
      await prisma.user.create({
        data: user,
      });
    }

    console.log("Seed data has been inserted successfully.");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
