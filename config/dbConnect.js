
import mongoose from "mongoose";

const connectDB = async () => {
  const maxRetries = 3;
  const retryDelay = 2000;
  let attempts = 0;

  const atlasUri = process.env.MONGO_URI;
  const localUri = "mongodb://localhost:27017/userAuth";
  const uri = atlasUri || localUri;

  if (!atlasUri) {
    console.warn("WARNING: MONGO_URI not found in .env, falling back to local MongoDB.");
  }

  // Mask sensitive parts of the URI for logging
  const maskedUri = uri.replace(/\/\/.*:.*@/, "//<user>:<pass>@");

  console.log(`Connecting to MongoDB at: ${maskedUri}`);

  while (attempts < maxRetries) {
    try {
      await mongoose.connect(uri, {
        family: 4,
        serverSelectionTimeoutMS: 5000
      });
      console.log("MongoDB Connected Successfully");
      return;
    } catch (err) {
      attempts++;
      console.error(`MongoDB connection attempt ${attempts} failed:`, err.message);

      if (err.message.includes("ECONNREFUSED") || err.message.includes("querySrv")) {
        console.error("DNS/Connectivity error detected. Check your network or use a standard connection string.");
      }

      if (attempts >= maxRetries) {
        if (uri !== localUri) {
          console.warn("Failed to connect to Atlas. Attempting local MongoDB connection as a final fallback...");
          try {
            await mongoose.connect(localUri);
            console.log("Connected to Local MongoDB Successfully");
            return;
          } catch (localErr) {
            console.error("Local MongoDB connection also failed:", localErr.message);
          }
        }
        console.error("All connection attempts failed. Exiting.");
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, retryDelay));
    }
  }
};

export default connectDB;
