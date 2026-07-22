import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.js";
import * as newsController from "../controllers/news.controller.js";

const router = express.Router();

// Specific Query Stacks (Must sit ABOVE /:id params to avoid matching collisions)
router.get("/search", newsController.searchNews);
router.get("/trending", newsController.getTrendingNews);
router.get("/latest", newsController.getLatestNews);
router.get("/breaking", newsController.getBreakingNews);
router.get("/category/:category", newsController.getNewsByCategory);
router.get("/related/:id", newsController.getRelatedNews);

router.get("/my-submissions", newsController.getMySubmissions);


// Global Document Collections
router.get("/", newsController.getAllNews);
router.get("/:id", newsController.getNewsById);

// Content Creation & Modifications (RBAC Protected)
router.post("/", authMiddleware, authorizeRoles("admin", "reporter"), newsController.createNews);
router.patch("/:id", authMiddleware, authorizeRoles("admin", "reporter"), newsController.updateNews);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), newsController.deleteNews);

// User Interactivity Endpoints
router.post("/:id/like", newsController.likeNews);
router.post("/:id/share", newsController.shareNews);
router.post("/:id/view", newsController.viewNews);

// Nested Comment Infrastructures
router.post("/:id/comment", authMiddleware, newsController.addComment);
router.get("/:id/comments", newsController.getComments);
router.delete("/comment/:commentId", authMiddleware, newsController.deleteComment);

export default router;
