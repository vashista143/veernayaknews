import VideoAd from "../models/VideoAd.js";
import { uploadToR2 } from "../config/r2.js";

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

// POST /api/video-ad - Create new video ad request (defaults to isAd: false)
export const createVideoAd = async (req, res) => {
  try {
    const {
      businessName,
      contactName,
      email,
      phone,
      adTitle,
      description,
      targetUrl,
      videoUrl: externalVideoUrl,
      durationSeconds,
    } = req.body;

    if (!businessName || !contactName || !email || !phone || !adTitle) {
      return sendResponse(res, 400, false, "Please fill in all required fields.");
    }

    let finalVideoUrl = externalVideoUrl || "";

    if (req.file) {
      finalVideoUrl = await uploadToR2(req.file);
    }

    if (!finalVideoUrl) {
      return sendResponse(res, 400, false, "Please upload a video file or provide a video link.");
    }

    const newAd = await VideoAd.create({
      user: req.user.id,
      businessName,
      contactName,
      email,
      phone,
      adTitle,
      description,
      targetUrl,
      videoUrl: finalVideoUrl,
      durationSeconds: Number(durationSeconds) || 30,
      isAd: false, // Default false upon user upload
      status: "Pending",
    });

    return sendResponse(res, 201, true, "Video advertisement request submitted successfully.", {
      ad: newAd,
    });
  } catch (error) {
    console.error("Create Video Ad Error:", error);
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/video-ad/active - Fetch only approved ads with isAd: true
export const getActiveVideoAds = async (req, res) => {
  try {
    const ads = await VideoAd.find({
      status: "Approved",
      isAd: true,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "Active video ads retrieved.", { submissions: ads });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/video-ad/my-submissions
export const getMyVideoAds = async (req, res) => {
  try {
    const submissions = await VideoAd.find({
      user: req.user.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "User video ad submissions retrieved.", { submissions });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/video-ad/all (Admin)
export const getAllVideoAds = async (req, res) => {
  try {
    const submissions = await VideoAd.find({ isDeleted: false })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "All video ad submissions retrieved.", { submissions });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// PATCH /api/video-ad/:id/status - Admin status update
export const updateVideoAdStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const { id } = req.params;

    if (!["Approved", "Rejected", "Pending", "Expired"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value.");
    }

    const ad = await VideoAd.findById(id);
    if (!ad) {
      return sendResponse(res, 404, false, "Video advertisement request not found.");
    }

    ad.status = status;
    if (adminRemarks !== undefined) ad.adminRemarks = adminRemarks;

    // Flip isAd flag to true ONLY when approved by admin
    if (status === "Approved") {
      ad.isAd = true;
    } else {
      ad.isAd = false;
    }

    await ad.save();

    return sendResponse(res, 200, true, `Video ad status updated to ${status}.`, { ad });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/video-ad/reels - Fetch all approved videos (both news reels and ads)
export const getReelsFeed = async (req, res) => {
  try {
    const videos = await VideoAd.find({
      status: "Approved",
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "Reels feed retrieved successfully.", {
      videos,
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
