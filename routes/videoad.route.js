import express from "express";
import multer from "multer";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  createVideoAd,
  getActiveVideoAds,
  getAllVideoAds,
  getMyVideoAds,
  getReelsFeed,
  updateVideoAdStatus,
} from "../controllers/videoad.controller.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public Reels Feed Endpoint
router.get("/reels", getReelsFeed);
router.get("/active", getActiveVideoAds);

// Protected User Routes
router.post("/", authMiddleware, upload.single("videoFile"), createVideoAd);
router.get("/my-submissions", authMiddleware, getMyVideoAds);

// Admin Routes
router.get("/all", authMiddleware, authorizeRoles("admin"), getAllVideoAds);
router.patch("/:id/status", authMiddleware, authorizeRoles("admin"), updateVideoAdStatus);

export default router;
