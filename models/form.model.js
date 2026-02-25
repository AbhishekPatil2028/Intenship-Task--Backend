import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isDeleted:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

export default mongoose.model("FormData", formSchema);
