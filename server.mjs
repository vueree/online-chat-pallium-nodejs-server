import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./prismaClient.js"; // добавлено .js
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware для обработки JSON
app.use(express.json());

// Настройки CORS
const corsOptions = {
  origin: "*", // временно разрешить все источники для отладки
  methods: ["GET", "POST", "DELETE"], // разрешенные методы
  credentials: true // разрешить куки
};

// Применение CORS middleware
app.use(cors(corsOptions));

// Подключение маршрутов
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Функция для запуска сервера
const startServer = async () => {
  await connectDB(); // Подключение к базе данных

  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
};

// Запуск сервера
startServer();
