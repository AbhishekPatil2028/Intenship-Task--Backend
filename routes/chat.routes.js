import express from "express";
import { getPrivateChat } from "../controllers/chat.controller.js";
import Chat from "../models/Chat.model.js";

const router = express.Router();

// 🔥 1-to-1 chat history
router.get("/:userId/:otherUserId", getPrivateChat);
router.get("/last-messages", async (req, res) => {
  const chats = await Chat.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$receiverId",
        lastMessage: { $first: "$$ROOT" }
      }
    }
  ]);

  const map = {};
  chats.forEach(c => {
    map[c._id] = c.lastMessage;
  });

  res.json(map);
});


export default router;
