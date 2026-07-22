import News from "../models/News.js";

// Helper utility to structure standard JSON responses
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

// GET /api/news
export const getAllNews = async (req, res) => {
  try {
    const articles = await News.find({ isDeleted: false, status: "Published" })
      .populate("author", "name avatar")
      .sort({ publishedAt: -1 });
    return sendResponse(res, 200, true, "Articles retrieved successfully.", { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const userId = req.user.id; // from authMiddleware
    const submissions = await News.find({ author: userId })
      .sort({ createdAt: -1 })
      .select('title thumbnail status createdAt publishedAt rejectionReason');

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/news/:id
export const getNewsById = async (req, res) => {
  try {
    const article = await News.findOne({ _id: req.params.id, isDeleted: false })
      .populate("author", "name avatar");
    if (!article) return sendResponse(res, 404, false, "Article profile not found.");
    return sendResponse(res, 200, true, "Article captured.", { article });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// POST /api/news
export const createNews = async (req, res) => {
  try {
    const articleData = {
      ...req.body,
      author: req.user.id, // Derived dynamically from active decoded token
      publishedAt: req.body.status === "Published" ? new Date() : null
    };
    const article = await News.create(articleData);
    return sendResponse(res, 201, true, "Article content created successfully.", { article });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// PATCH /api/news/:id
export const updateNews = async (req, res) => {
  try {
    if (req.body.status === "Published") req.body.publishedAt = new Date();
    const article = await News.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!article) return sendResponse(res, 404, false, "Target document not found.");
    return sendResponse(res, 200, true, "Article updated successfully.", { article });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// DELETE /api/news/:id
export const deleteNews = async (req, res) => {
  try {
    // Soft delete framework ensures system stability and internal metrics tracing
    const article = await News.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!article) return sendResponse(res, 404, false, "Document not found.");
    return sendResponse(res, 200, true, "Article soft-deleted successfully.");
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/category/:category
export const getNewsByCategory = async (req, res) => {
  try {
    const articles = await News.find({ 
      category: req.params.category, 
      isDeleted: false, 
      status: "Published" 
    }).sort({ publishedAt: -1 });
    return sendResponse(res, 200, true, `Category items for ${req.params.category} extracted.`, { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/trending
export const getTrendingNews = async (req, res) => {
  try {
    const articles = await News.find({ isTrending: true, isDeleted: false, status: "Published" })
      .sort({ views: -1 })
      .limit(10);
    return sendResponse(res, 200, true, "Trending news extracted.", { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/latest
export const getLatestNews = async (req, res) => {
  try {
    const articles = await News.find({ isDeleted: false, status: "Published" })
      .sort({ createdAt: -1 })
      .limit(10);
    return sendResponse(res, 200, true, "Latest feed updates pulled.", { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/breaking
export const getBreakingNews = async (req, res) => {
  try {
    const articles = await News.find({ isBreaking: true, isDeleted: false, status: "Published" })
      .sort({ publishedAt: -1 });
    return sendResponse(res, 200, true, "Breaking flash alerts compiled.", { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/search?q=query_string
export const searchNews = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return sendResponse(res, 400, false, "Query string parameter 'q' is missing.");
    const articles = await News.find(
      { $text: { $search: q }, isDeleted: false, status: "Published" },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
    return sendResponse(res, 200, true, "Search completed.", { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/related/:id
export const getRelatedNews = async (req, res) => {
  try {
    const article = await News.findById(req.params.id);
    if (!article) return sendResponse(res, 404, false, "Source document not found.");
    const articles = await News.find({
      _id: { $ne: article._id },
      category: article.category,
      isDeleted: false,
      status: "Published"
    }).limit(5);
    return sendResponse(res, 200, true, "Contextually related items compiled.", { articles });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// POST /api/news/:id/like
export const likeNews = async (req, res) => {
  try {
    const article = await News.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!article) return sendResponse(res, 404, false, "Article not found.");
    return sendResponse(res, 200, true, "Like incremented.", { likes: article.likes });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// POST /api/news/:id/share
export const shareNews = async (req, res) => {
  try {
    const article = await News.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
    if (!article) return sendResponse(res, 404, false, "Article not found.");
    return sendResponse(res, 200, true, "Share metrics updated.", { shares: article.shares });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// POST /api/news/:id/view
export const viewNews = async (req, res) => {
  try {
    const article = await News.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!article) return sendResponse(res, 404, false, "Article not found.");
    return sendResponse(res, 200, true, "View count incremented.", { views: article.views });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// POST /api/news/:id/comment
export const addComment = async (req, res) => {
  try {
    const { text, userName } = req.body;
    if (!text) return sendResponse(res, 400, false, "Comment body content parameter 'text' required.");
    const commentData = { user: req.user.id, userName: userName || "Anonymous User", text };
    const article = await News.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: commentData }, $inc: { commentsCount: 1 } },
      { new: true }
    );
    if (!article) return sendResponse(res, 404, false, "Article target not found.");
    return sendResponse(res, 201, true, "Comment posted successfully.", { comments: article.comments });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/news/:id/comments
export const getComments = async (req, res) => {
  try {
    const article = await News.findById(req.params.id).select("comments");
    if (!article) return sendResponse(res, 404, false, "Article target not found.");
    return sendResponse(res, 200, true, "Comments fetched.", { comments: article.comments });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// DELETE /api/news/comment/:commentId
export const deleteComment = async (req, res) => {
  try {
    const article = await News.findOneAndUpdate(
      { "comments._id": req.params.commentId },
      { $pull: { comments: { _id: req.params.commentId } }, $inc: { commentsCount: -1 } },
      { new: true }
    );
    if (!article) return sendResponse(res, 404, false, "Target comment entity not found.");
    return sendResponse(res, 200, true, "Comment removed cleanly.");
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
