import userModel from "../Models/userModel.js";
import * as userService from "../Services/userService.js";
import { validationResult } from "express-validator";
import clientRedis from "../Services/redisService.js";

export const createUsercontroller = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const user = await userService.createUser(req.body);
    const token = await user.generateJWT();
    delete user._doc.password;
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const loginController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");

    if (!user)
      return res.status(401).json({
        error: "Invalid email or password",
      });

    const isMatch = await user.isValidPassword(password);

    if (!isMatch)
      return res.status(401).json({
        error: "Invalid email or password",
      });

    const token = await user.generateJWT();
    delete user._doc.password;

    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const profileController = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};

export const getAlluserController = async (req, res) => {
  try {
    const userEmail = req.user.email.trim().toLowerCase();
    const loggedInUser = await userModel.findOne({ email: userEmail });
    const allUsers = await userService.getAllUser({ userId : loggedInUser._id });
    
    return res.status(200).json({
      users : allUsers
    })
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Unuthorized user");
    }

    clientRedis.set(token, "logout", "EX", 60 * 60 * 24);
    return res.status(201).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
