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
import { fileURLToPath } from "url";

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

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    httpServer.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
  }
};

startServer();
