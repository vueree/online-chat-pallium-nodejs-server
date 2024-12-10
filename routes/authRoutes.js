import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  console.log("Полученные данные:", req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username и password обязательны" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET не установлен");
      return res
        .status(500)
        .json({ message: "Ошибка сервера: JWT_SECRET не установлен" });
    }

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.status(201).json({
      message: "Пользователь зарегистрирован",
      token,
      user: { id: newUser.id, username: newUser.username }
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res
      .status(500)
      .json({ message: "Ошибка регистрации", error: error.message || error });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) {
      return res.status(400).json({ message: "Неверные учетные данные" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверные учетные данные" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET не установлен");
      return res
        .status(500)
        .json({ message: "Ошибка сервера: JWT_SECRET не установлен" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Ошибка входа", error });
  }
});

export default router;
