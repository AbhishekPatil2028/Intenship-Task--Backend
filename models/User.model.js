import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, 
  },
  password: {
    type: String, // hashed password
  },
  provider: {
    type: String, // "local" | "google"
    required: true,
  },
}, { timestamps: true ,
    collection: "users"
});

export default mongoose.model("User", userSchema);
