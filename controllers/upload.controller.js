import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto", // image or video
      folder: "uploads",
    });

    // remove file from local storage
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
