import express from "express";
import multer from "multer";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.js";
import * as advertiseController from "../controllers/advertise.controller.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public Endpoint (Active approved ads for home/category banners)
router.get("/active", advertiseController.getActiveAds);

// Protected User Endpoints
router.post(
  "/",
  authMiddleware,
  upload.single("bannerImage"),
  advertiseController.createAdSubmission
);
router.get("/my-submissions", authMiddleware, advertiseController.getMyAdSubmissions);

// Admin Only Endpoints
router.get(
  "/all",
  authMiddleware,
  authorizeRoles("admin"),
  advertiseController.getAllAdSubmissions
);
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  advertiseController.updateAdStatus
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  advertiseController.deleteAdSubmission
);

export default router;