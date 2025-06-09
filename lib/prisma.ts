import { PrismaClient } from "@prisma/client";
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in environment variables!");
  throw new Error("Missing DATABASE_URL");
} else {
  console.log("✅ DATABASE_URL detected:", process.env.DATABASE_URL);
}
const prisma = new PrismaClient();
export default prisma;
