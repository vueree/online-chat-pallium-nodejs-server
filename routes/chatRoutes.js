import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";

const router = express.Router();

// Middleware для проверки токена пользователя
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Нет токена" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

router.post("/send", authenticateToken, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Контент сообщения обязателен" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: user.id,
        message: message
      }
    });

    res.status(201).json({
      username: user.username,
      message: newMessage.message,
      timestamp: newMessage.timestamp
    });
  } catch (error) {
    console.error("Ошибка отправки сообщения:", error);
    res.status(500).json({ message: "Ошибка отправки сообщения" });
  }
});

// Получение всех сообщений с пагинацией
router.get("/messages", authenticateToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Параметры пагинации

  // Проверяем и приводим параметры к числу
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    isNaN(limitNumber) ||
    pageNumber <= 0 ||
    limitNumber <= 0
  ) {
    return res
      .status(400)
      .json({ message: "Некорректные параметры пагинации" });
  }

  const skip = (pageNumber - 1) * limitNumber; // Вычисляем, сколько записей пропустить

  try {
    // Получаем сообщения с учетом пагинации
    const messages = await prisma.message.findMany({
      skip: 0, // Начало списка
      take: 10, // Первые 10 сообщений
      orderBy: { timestamp: "asc" },
      include: { sender: { select: { username: true } } }
    });

    // Получаем общее количество сообщений для подсчета страниц
    const totalMessages = await prisma.message.count();
    const totalPages = Math.ceil(totalMessages / limitNumber);

    // Форматируем данные для ответа
    const formattedMessages = messages.map((msg) => ({
      message: msg.message,
      username: msg.sender?.username || "Unknown",
      timestamp: msg.timestamp.toISOString()
    }));

    // Возвращаем данные в формате JSON
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalMessages,
      messages: formattedMessages
    });
  } catch (error) {
    console.error("Ошибка получения сообщений:", error);
    res.status(500).json({ message: "Ошибка получения сообщений" });
  }
});

// Очистка сообщений
router.delete("/clear", authenticateToken, async (req, res) => {
  try {
    await prisma.message.deleteMany(); // Удаляем все сообщения
    res.status(204).send(); // Успешно, без содержимого
  } catch (error) {
    console.error("Ошибка очистки сообщений:", error);
    res.status(500).json({ message: "Ошибка очистки сообщений" });
  }
});

export default router;
