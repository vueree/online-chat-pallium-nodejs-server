import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectDB = async () => {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  try {
    await prisma.$connect(); // Устанавливаем подключение к базе данных через Prisma
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1); // Останавливаем приложение, если не удаётся подключиться
  }
};

export { prisma, connectDB };
