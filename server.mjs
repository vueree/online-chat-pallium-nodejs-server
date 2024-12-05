import express from "express";
import path from "path";
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

// Middleware
app.use(express.json());
const corsOptions = {
  origin: ["http://localhost:5173", "https://pallium.onrender.com"],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
};
app.use(cors(corsOptions));

// Routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

// Отдача статических файлов Vue приложения
app.use(express.static(path.join(__dirname, "dist")));

// Все запросы, которые не являются API-запросами, перенаправляем на index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Connect to DB
connectDB();

// Create HTTP Server and Socket.io
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

// Chat Namespace
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

// Start the server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("База данных подключена успешно");

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
    process.exit(1); // Exit with error code
  }
};

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  prisma.$disconnect().then(() => process.exit(0));
});

// Initialize the server
startServer();
