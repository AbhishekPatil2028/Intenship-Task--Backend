import admin from "../config/firebaseAdmin.js";
import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.js";

export const googleLogin = async (req, res) => {
  try {
    // 1️⃣ Read Firebase ID token from request
    const { token } = req.body;
   console.log("TOKEN RECEIVED:", token?.slice(0, 30));
    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    // 2️⃣ Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    const {
      uid,
      email,
      name,
      picture,
      email_verified,
    } = decoded;

    if (!email) {
      return res.status(400).json({ message: "Email not found in token" });
    }

    // 3️⃣ Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        uid,
        email,
        name: name || "",
        avatar: picture || "",
        isEmailVerified: email_verified || false,
        provider: "google",
      });
    }

    // 4️⃣ Generate JWT (YOUR backend token)
    const jwtToken = generateToken({
      userId: user._id,
      uid: user.uid,
      email: user.email,
    });

    // 5️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Google token",
    });
  }
};
