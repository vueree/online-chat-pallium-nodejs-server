import { prisma } from "../prismaClient.js";

export const createMessage = async (senderId, content) => {
  return prisma.message.create({
    data: {
      senderId,
      content
    }
  });
};

export const getMessagesByUserId = async (userId) => {
  return prisma.message.findMany({
    where: { senderId: userId },
    include: { sender: true }
  });
};
