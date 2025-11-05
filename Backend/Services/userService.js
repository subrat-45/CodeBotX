import userModel from "../Models/userModel.js";
import bcrypt from "bcryptjs";

export const createUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Please enter valid email or password");
  }

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    email,
    password: hashedPassword,
  });

  return user;
};

export const getAllUser = async ({ userId }) => {
  const user = await userModel.find({
    _id: { $ne: userId },
  });
  return user;
};
