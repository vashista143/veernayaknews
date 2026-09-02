import VideoAd from "../models/VideoAd.js";
import { uploadToR2 } from "../config/r2.js";

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

// POST /api/video-ad - Create new video ad request with payment verification
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
      totalAmount,
    } = req.body;

    if (!businessName || !contactName || !email || !phone || !adTitle) {
      return sendResponse(res, 400, false, "Please fill in all required fields.");
    }

    // Extract files from Multer upload.fields()
    const videoFile = req.files?.videoFile?.[0];
    const receiptFile = req.files?.paymentReceipt?.[0];

    if (!receiptFile) {
      return sendResponse(res, 400, false, "Payment proof receipt is required.");
    }

    let finalVideoUrl = (externalVideoUrl || "").trim();

    if (videoFile) {
      finalVideoUrl = await uploadToR2({
        originalname: videoFile.originalname,
        buffer: videoFile.buffer,
        mimetype: videoFile.mimetype,
      });
    }

    if (!finalVideoUrl) {
      return sendResponse(res, 400, false, "Please upload a video file or provide a video link.");
    }

    // Upload Payment Receipt Screenshot
    const paymentReceiptUrl = await uploadToR2({
      originalname: receiptFile.originalname,
      buffer: receiptFile.buffer,
      mimetype: receiptFile.mimetype,
    });

    const newAd = await VideoAd.create({
      user: req.user.id,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      adTitle: adTitle.trim(),
      description: (description || "").trim(),
      targetUrl: (targetUrl || "").trim(),
      videoUrl: finalVideoUrl,
      totalAmount: Number(totalAmount) || 3000,
      paymentReceipt: paymentReceiptUrl,
      paymentStatus: "Pending Verification",
      durationSeconds: Number(durationSeconds) || 30,
      isAd: false,
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

// PATCH /api/video-ad/:id/status - Admin status & payment verification update
export const updateVideoAdStatus = async (req, res) => {
  try {
    const { status, paymentStatus, isAd, adminRemarks } = req.body;
    const { id } = req.params;

    if (status && !["Approved", "Rejected", "Pending", "Expired"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value.");
    }

    if (paymentStatus && !["Pending Verification", "Verified", "Failed"].includes(paymentStatus)) {
      return sendResponse(res, 400, false, "Invalid payment status value.");
    }

    const ad = await VideoAd.findById(id);
    if (!ad) {
      return sendResponse(res, 404, false, "Video advertisement request not found.");
    }

    if (status) ad.status = status;
    if (paymentStatus) {
      ad.paymentStatus = paymentStatus;
    } else if (status === "Approved") {
      ad.paymentStatus = "Verified";
    } else if (status === "Rejected") {
      ad.paymentStatus = "Failed";
    }

    if (typeof isAd === "boolean") ad.isAd = isAd;
    if (adminRemarks !== undefined) ad.adminRemarks = adminRemarks;

    await ad.save();

    return sendResponse(res, 200, true, `Video ad status updated to ${ad.status}.`, { ad });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/video-ad/reels - Fetch all approved videos
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
