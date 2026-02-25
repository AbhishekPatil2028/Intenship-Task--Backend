import express from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { googleLogin } from "../controllers/googleAuth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
// import { verifyFirebaseToken } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);

// test protected API
router.get("/profile", protect, (req, res) => {
  res.json({ message: "User authenticated", userId: req.userId });
});
// router.post("/google", verifyFirebaseToken, googleLogin);


export default router;
