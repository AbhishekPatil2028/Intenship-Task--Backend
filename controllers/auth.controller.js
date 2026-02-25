import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

/**
 * 🔐 PASSWORD VALIDATION (backend security)
 */
const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password)
  );
};

/**
 * 📝 SIGNUP (Email + Password)
 */
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Strong password check
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    // 3️⃣ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create user
    await User.create({
      email,
      password: hashedPassword,
      provider: "local",
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * 🔑 LOGIN (Email + Password)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });
    if (!user || user.provider !== "local") {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate JWT (PRODUCTION SAFE)
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d", // ⏱ real apps use 1d / 7d
      }
    );

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
