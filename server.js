import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import passport from 'passport';
import { Server } from "socket.io";
import mongoose from  "mongoose";

import connectDB from "./config/dbConnect.js";



// routes
import formRoutes from "./routes/form.routes.js";
import mailRoutes from "./routes/mail.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatAuthRoutes from "./routes/ChatAuth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import passportauthRoutes from './routes/passportauth.routes.mjs';
import './middleware/passportauth.middleware.mjs';

// models
import ChatUser from "./models/ChatUser.model.js";
import Chat from "./models/Chat.model.js";

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json())
connectDB();
app.use(passport.initialize());



/* ---------------- ROUTES ---------------- */
app.use("/api/form", formRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chatAuth", chatAuthRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/passportauth', passportauthRoutes);

app.use("/api", uploadRoutes);



// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Passport.js Dual Token Authentication API',
    version: '1.0.0',
    system: 'Dual Token (Access + Refresh)',
    endpoints: {
      login: 'POST /api/auth/login',
      signup: 'POST /api/auth/signup',
      refresh: 'POST /api/auth/refresh',
      logout: 'POST /api/auth/logout',
      protected: 'GET /api/auth/protected',
      checkToken: 'GET /api/auth/check-token'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use( (req, res,next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});


/* ---------------- SOCKET ---------------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});


const onlineUsersMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  /* ---------- JOIN ---------- */
  socket.on("join", async ({ userId }) => {
    onlineUsersMap.set(userId, socket.id);

    await ChatUser.findByIdAndUpdate(userId, { isOnline: true });

    //  IMPORTANT: SEND _id + name
    const onlineUsers = await ChatUser.find({ isOnline: true })
      .select("_id name");

    io.emit("onlineUsers", onlineUsers);
  });

  /* ---------- SEND MESSAGE (PRIVATE) ---------- */
  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, message, senderName,type } = data;

    const chat = await Chat.create({
      senderId,
      receiverId,
      message,
      isRead: false,
    });

    const payload = {
      _id: chat._id,
      senderId,
      receiverId,
      senderName,
      message,
      type,
      createdAt: chat.createdAt,
    };

    const receiverSocketId = onlineUsersMap.get(receiverId);

    // send to receiver
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", payload);
    }

    // send back to sender
    socket.emit("receiveMessage", payload);
  });

  /* ---------- DELIVERED ✔ ---------- */
  socket.on("messageDelivered", ({ messageId, senderId }) => {
    const senderSocketId = onlineUsersMap.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDelivered", { messageId });
    }
  });

  /* ---------- SEEN ✔✔ ---------- */
  socket.on("messageSeen", async ({ messageId, senderId }) => {
    await Chat.findByIdAndUpdate(messageId, { isRead: true });

    const senderSocketId = onlineUsersMap.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", { messageId });
    }
  });

  /* ---------- MARK CHAT READ (UNREAD RESET) ---------- */
  socket.on("markRead", async ({ senderId, receiverId }) => {
    await Chat.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
  });

  /* ---------- TYPING ---------- */
 socket.on("typing", ({ receiverId, senderId }) => {
  const receiverSocketId = onlineUsersMap.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("typing", { senderId });
  }
});

socket.on("stopTyping", ({ receiverId, senderId }) => {
  const receiverSocketId = onlineUsersMap.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("stopTyping", { senderId });
  }
});


  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", async () => {
    for (let [userId, socketId] of onlineUsersMap.entries()) {
      if (socketId === socket.id) {
        onlineUsersMap.delete(userId);
        await ChatUser.findByIdAndUpdate(userId, { isOnline: false });
        break;
      }
    }

    // 🔥 re-emit updated online users
    const onlineUsers = await ChatUser.find({ isOnline: true })
      .select("_id name");

    io.emit("onlineUsers", onlineUsers);
    console.log("ONLINE USERS EMITTED:", onlineUsers.map(u => u.name));
  });
});

server.listen(5000, () => {
  console.log("Server running on 5000");
});
