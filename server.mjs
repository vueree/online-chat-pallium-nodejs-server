import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./prismaClient.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();

// Middleware for JSON processing
app.use(express.json());

// CORS settings
const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Route connections
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO instance with namespace
const io = new Server(httpServer, { cors: corsOptions });

// Handle WebSocket connections for the 'chat' namespace
const chatNamespace = io.of("/chat");
chatNamespace.on("connection", (socket) => {
  console.log("New WebSocket connection in /chat namespace");
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

// Start server
startServer();
