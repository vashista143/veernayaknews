import express from 'express';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import passport from 'passport';
const router = express.Router();

// Public Authentication Routes
router.post("/register", authController.registerUser);
router.post("/login", authController.login);
// router.post("/google", authController.googleLogin);
router.post("/refresh-token", authController.refreshAccessToken);

// // Google Callback Endpoint (Where Google sends the user after authentication)
// router.get(
//   "/google/callback", 
//   passport.authenticate("google", { session: false, failureRedirect: "/login" }), 
//   authController.googleLoginSuccess
// );
// Standard Protected User Routes
router.get("/me", authMiddleware, authController.getMe);
router.patch("/update-profile", authMiddleware, authController.updateProfile);

// Example: Admin Only Route
router.delete("/delete-account", authMiddleware, authorizeRoles("admin"), authController.deleteAccount);
router.post("/logout", authMiddleware, authController.logoutUser);
// Example: Admin & Reporter Shared Management Route
// router.get("/reports", authMiddleware, authorizeRoles("admin", "reporter"), reportController.getAll);

export default router;
