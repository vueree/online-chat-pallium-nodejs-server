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

router.get("/messages", authenticateToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    isNaN(limitNumber) ||
    pageNumber <= 0 ||
    limitNumber <= 0 ||
    limitNumber > 100
  ) {
    return res.status(400).json({
      message: "Некорректные параметры пагинации",
      details: {
        page: pageNumber,
        limit: limitNumber
      }
    });
  }

  try {
    const totalMessages = await prisma.message.count();
    const totalPages = Math.ceil(totalMessages / limitNumber);

    const skip = (pageNumber - 1) * limitNumber;
    const take = limitNumber;

    const messages = await prisma.message.findMany({
      skip,
      take,
      orderBy: { timestamp: "desk" },
      include: {
        sender: {
          select: {
            username: true,
            id: true
          }
        }
      }
    });

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalMessages,
      messages: messages.map((msg) => ({
        ...msg,
        username: msg.sender?.username || "Anonymous"
      }))
    });
  } catch (error) {
    console.error("Ошибка получения сообщений:", error);
    res.status(500).json({
      message: "Ошибка получения сообщений",
      error: error instanceof Error ? error.message : "Unknown error"
    });
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
