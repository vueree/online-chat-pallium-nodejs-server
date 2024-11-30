import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectDB = async () => {
  console.log("pallium:", process.env.pallium);

  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export { prisma, connectDB };
