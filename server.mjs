import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./prismaClient.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { connectDB } from "./db.js";
import path from "path";

dotenv.config();

const app = express();

app.use(express.json());

const corsOptions = {
  origin: ["http://localhost:5173", "https://pallium.onrender.com"],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

connectDB();

// Используем import.meta.url для получения пути к текущему файлу
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Чтение конфигурации static.json, если файл существует
const staticConfigPath = path.join(__dirname, "static.json");
let staticConfig = {};
if (fs.existsSync(staticConfigPath)) {
  staticConfig = JSON.parse(fs.readFileSync(staticConfigPath, "utf-8"));
}

// Если указаны маршруты в static.json, добавляем логику для перенаправления на index.html
if (staticConfig.routes) {
  app.use((req, res, next) => {
    // Перенаправляем все запросы, кроме статических файлов, на index.html
    if (staticConfig.routes["/**"] && !req.url.startsWith("/static")) {
      res.sendFile(path.resolve(__dirname, "index.html"));
    } else {
      next();
    }
  });
}

// Статическая отдача файлов (например, для фронтенд ресурсов)
app.use(express.static(path.join(__dirname, "dist")));

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, { cors: corsOptions });

const chatNamespace = io.of("/chat");

chatNamespace.on("connection", (socket) => {
  console.log("User connected to chat");

  socket.on("send_message", async (data) => {
    try {
      console.log("Received message on server:", data);
      const { message, username } = data;

      const user = await prisma.user.findUnique({ where: { username } });

      if (!user) {
        console.error("Пользователь не найден");
        return;
      }

      const newMessage = await prisma.message.create({
        data: {
          senderId: user.id,
          message: message
        }
      });

      chatNamespace.emit("new_message", {
        username: user.username,
        message: newMessage.message,
        timestamp: newMessage.timestamp
      });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from chat namespace:", socket.id);
  });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("База данных подключена успешно");
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
  }
};

startServer();
