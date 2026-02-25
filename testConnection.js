import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/dbConnect.js";
(async () => {
    try {
        await connectDB();
        console.log('Test connection succeeded');
        process.exit(0);
    } catch (err) {
        console.error('Test connection failed', err);
        process.exit(1);
    }
})();
