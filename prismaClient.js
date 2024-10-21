// prismaClient.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Функция для подключения к базе данных
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Подключение к базе данных успешно");
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
    process.exit(1);
  }
};

export { prisma };
