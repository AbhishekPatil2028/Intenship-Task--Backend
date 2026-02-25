import Chat from "../models/Chat.model.js";

export const getPrivateChat = async (req, res) => {
  const { userId, otherUserId } = req.params;

  const chats = await Chat.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }).sort({ createdAt: 1 });

  res.json(chats);
};
