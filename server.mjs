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
  origin: ["http://localhost:5173", "https://pallium.onrender.com"],
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

chatNamespace.on("connection", (socket) => {
  console.log("User connected to chat");

  socket.on("message_history", async (data, callback) => {
    console.log("[DEBUG] Message History Request:", data);

    try {
      const { page = 1, perPage = 10 } = data;

      console.log(`[DEBUG] Pagination Parameters:`, { page, perPage });

      if (page <= 0 || perPage <= 0 || perPage > 100) {
        console.error(`[ERROR] Invalid Pagination:`, { page, perPage });
        return callback({
          success: false,
          error: "Invalid pagination parameters",
          details: { page, perPage }
        });
      }

      console.time("[PERFORMANCE] WS Message History");

      const totalMessages = await prisma.message.count();
      console.log(`[DEBUG] Total Messages:`, totalMessages);

      const totalPages = Math.ceil(totalMessages / perPage);
      console.log(`[DEBUG] Total Pages:`, totalPages);

      const messages = await prisma.message.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { timestamp: "asc" },
        include: {
          sender: {
            select: {
              username: true,
              id: true
            }
          }
        }
      });

      console.log(`[DEBUG] Fetched Messages Count:`, messages.length);
      console.timeEnd("[PERFORMANCE] WS Message History");

      callback({
        success: true,
        messages: messages.map((msg) => ({
          ...msg,
          username: msg.sender?.username || "Anonymous"
        })),
        page,
        totalPages
      });
    } catch (error) {
      console.error("[ERROR] WS Message History Error:", error);
      callback({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  console.log("Shutting down server...");
  prisma.$disconnect().then(() => process.exit(0));
});

startServer();
