import express from "express";
import multer from "multer";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.js";
import * as videoAdController from "../controllers/videoad.controller.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// User Routes
router.post(
  "/",
  authMiddleware,
  upload.single("videoFile"), // Fields expects formData.append("videoFile", ...)
  videoAdController.createVideoAd
);

router.get("/my-submissions", authMiddleware, videoAdController.getMyVideoAds);

// Admin Routes
router.get("/all", authMiddleware, authorizeRoles("admin"), videoAdController.getAllVideoAds);
router.patch("/:id/status", authMiddleware, authorizeRoles("admin"), videoAdController.updateVideoAdStatus);

export default router;