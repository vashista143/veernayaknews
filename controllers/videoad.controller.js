import VideoAd from "../models/VideoAd.js";
import { uploadToR2 } from "../config/r2.js";

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

// POST /api/video-ad - Create new video ad request
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

    // If video file was uploaded directly
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

// GET /api/video-ad/my-submissions - Fetch user's video ads
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

// GET /api/video-ad/all - Fetch all video ads (Admin)
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

    await ad.save();

    return sendResponse(res, 200, true, `Video ad status updated to ${status}.`, { ad });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};