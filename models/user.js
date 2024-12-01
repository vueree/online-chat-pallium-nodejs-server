export const createUser = async (username, password) => {
  try {
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    return await prisma.user.create({
      data: { username, password }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error; // Пробрасываем ошибку выше
  }
};

export const getUserByUsername = async (username) => {
  try {
    if (!username) {
      throw new Error("Username is required");
    }

    return await prisma.user.findUnique({
      where: { username }
    });
  } catch (error) {
    console.error("Error fetching user by username:", error);
    throw error; // Пробрасываем ошибку выше
  }
};
