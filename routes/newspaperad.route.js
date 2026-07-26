import express from "express";
import multer from "multer";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.js";
import * as newspaperAdController from "../controllers/newspaperad.controller.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Protected User Endpoints
router.post(
  "/",
  authMiddleware,
  upload.single("artworkImage"),
  newspaperAdController.createNewspaperAd
);
router.get("/my-submissions", authMiddleware, newspaperAdController.getMyNewspaperAds);

// Admin Only Endpoints
router.get(
  "/all",
  authMiddleware,
  authorizeRoles("admin"),
  newspaperAdController.getAllNewspaperAds
);
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  newspaperAdController.updateNewspaperAdStatus
);

export default router;