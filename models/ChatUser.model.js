import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: { type: String, unique: true },
  password: String,

    isOnline: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("ChatUser", userSchema);
