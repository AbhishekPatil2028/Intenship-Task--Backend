import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
    },
    message: String,

    // 🔥 unread flag
    isRead: {
      type: Boolean,
      default: false,
    },
    type: { type: String, default: "text" },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
