import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Ожидаем завершения всех транзакций перед очисткой данных
    await prisma.$transaction([
      prisma.user.deleteMany(), // Очистка пользователей
      prisma.post.deleteMany() // Очистка постов (или других таблиц, если нужно)
      // Добавьте другие модели, если хотите очистить их данные
    ]);
    console.log("База данных очищена");
  } catch (error) {
    console.error("Ошибка при очистке базы данных:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
