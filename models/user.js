import { prisma } from "../prismaClient.js";

export const createUser = async (username, password) => {
  return prisma.user.create({
    data: { username, password }
  });
};

export const getUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username }
  });
};
