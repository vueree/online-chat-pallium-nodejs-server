import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js"; // добавлено .js

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

// Отправка сообщения
router.post("/send", authenticateToken, async (req, res) => {
  const { content } = req.body;

  // Проверка наличия контента сообщения
  if (!content || typeof content !== "string") {
    return res.status(400).json({ message: "Контент сообщения обязателен" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    // Проверка, существует ли пользователь
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: user.id,
        content
      }
    });

    res.status(201).json({ message: "Сообщение отправлено", newMessage });
  } catch (error) {
    console.error("Ошибка отправки сообщения:", error);
    res.status(500).json({ message: "Ошибка отправки сообщения" });
  }
});

// Получение всех сообщений
router.get("/messages", authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: {
        sender: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: "desc" }
    });
    res.status(200).json(messages);
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
