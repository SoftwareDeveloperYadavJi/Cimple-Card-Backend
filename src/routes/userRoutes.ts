import express from 'express'
import multer from "multer";
import { getUserDetails, login, logout,refer,sendOTP, updateUserDetails, uploadImage, verifyOTP } from '../controllers/auth.js';
import { resetPassword, resetPasswordToken } from '../controllers/resetPassword.js';
import { verifyToken } from '../middleware/auth.js';
import limiter from '../middleware/ratelimit.js';

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refer",verifyToken, refer);
router.get("/getdetails",verifyToken,getUserDetails)
router.post("/send-otp",limiter,sendOTP)
router.post('/verify-otp', verifyOTP);
router.post("/uploadimage",upload.single("image"),uploadImage)

router.post("/send-token",limiter,resetPasswordToken)
router.post("/updatePassword",resetPassword)
router.put("/update",verifyToken,upload.single("image"),updateUserDetails)

export default router;
