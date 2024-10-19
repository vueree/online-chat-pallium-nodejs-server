import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  encryptionKey: { type: String, required: true } // Ключ шифрования для сообщений
});

export default mongoose.model("User", userSchema);
