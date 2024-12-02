import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./prismaClient.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { connectDB } from "./db.js";

dotenv.config();

const app = express();

app.use(express.json());

const corsOptions = {
  origin: ["http://localhost:5173", "https://pallium-backend.onrender.com"],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

connectDB();

const PORT = process.env.PORT || 3000;

// Create HTTP server
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
          message
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

// Start server function
const startServer = async () => {
  try {
    await prisma.$connect(); // Подключение к базе данных
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};
console.log("JWT_SECRET:", process.env.JWT_SECRET);

// Start server
startServer();
