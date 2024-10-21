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
        content
      }
    });

    res.status(201).json({ message: "Сообщение отправлено", newMessage });
  } catch (error) {
    res.status(500).json({ message: "Ошибка отправки сообщения", error });
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
    res.status(500).json({ message: "Ошибка получения сообщений", error });
  }
});

export default router;
