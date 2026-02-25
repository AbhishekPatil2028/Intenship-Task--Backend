import User from "../models/ChatUser.model.js";

/* SIGNUP */
export const signup = async (req, res) => {
  const { name, email,password } = req.body;

  const exists = await User.findOne({ email });
  
  if (exists) return res.status(400).json({ msg: "Email already exists" });
  

  const user = await User.create({ name, email,password });
  res.status(201).json(user);
};

/* LOGIN */
export const login = async (req, res) => {
  const { email,password } = req.body;

  const user = await User.findOne({ email,password });
  if (!user) {
    return res.status(404).json({ message: "Invalid credentials" });
  }

  user.isOnline = true;
  await user.save();

  res.json(user);
};

/* 🔥 GET ALL CHAT USERS (WHATSAPP CONTACT LIST) */
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("name email isOnline");
  res.json(users);
};
