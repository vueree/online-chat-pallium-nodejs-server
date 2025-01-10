import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./prismaClient.js";
import { connectDB } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  credentials: true
};
app.use(cors(corsOptions));

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

connectDB();

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

const chatNamespace = io.of("/chat");

// Middleware для проверки JWT токена в WebSocket соединении
chatNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

chatNamespace.on("connection", (socket) => {
  console.log("User connected to chat:", socket.id);

  // Обработка только отправки новых сообщений через WebSocket
  socket.on("send_message", async (data) => {
    try {
      const { message } = data;

      // Получаем информацию о пользователе
      const user = await prisma.user.findUnique({
        where: { id: socket.userId }
      });

      if (!user) {
        console.error("User not found");
        return;
      }

      // Сохраняем сообщение в базе данных
      const newMessage = await prisma.message.create({
        data: {
          senderId: user.id,
          message: message
        }
      });

      // Отправляем новое сообщение всем подключенным клиентам
      chatNamespace.emit("new_message", {
        id: newMessage.id,
        username: user.username,
        message: newMessage.message,
        timestamp: newMessage.timestamp
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from chat:", socket.id);
  });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  console.log("Shutting down server...");
  prisma.$disconnect().then(() => process.exit(0));
});

startServer();
