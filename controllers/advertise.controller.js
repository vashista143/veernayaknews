import Advertise from "../models/Advertise.js";
import { uploadToR2 } from "../config/r2.js";

// Helper utility for uniform JSON response structure
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

// ==========================================
// USER ENDPOINTS
// ==========================================

// POST /api/advertise - Submit a new Advertisement request
export const createAdSubmission = async (req, res) => {
  try {
    const {
      businessName,
      contactName,
      email,
      phone,
      adTitle,
      description,
      targetUrl,
      placement,
      durationDays,
    } = req.body;

    if (!businessName || !contactName || !email || !phone || !adTitle) {
      return sendResponse(res, 400, false, "Please fill in all required fields.");
    }

    let bannerImageUrl = "";
    if (req.file) {
      bannerImageUrl = await uploadToR2(req.file);
    }

    if (!bannerImageUrl) {
      return sendResponse(res, 400, false, "Advertisement banner image is required.");
    }

    // Validate placement slot
    const validPlacements = ["ad1", "ad2", "ad3"];
    const finalPlacement = validPlacements.includes(placement) ? placement : "ad1";

    const newAd = await Advertise.create({
      user: req.user.id,
      businessName,
      contactName,
      email,
      phone,
      adTitle,
      description,
      bannerImage: bannerImageUrl,
      targetUrl,
      placement: finalPlacement,
      durationDays: Number(durationDays) || 7,
      status: "Pending",
    });

    return sendResponse(res, 201, true, "Advertisement request submitted successfully.", {
      ad: newAd,
    });
  } catch (error) {
    console.error("Create Ad Submission Error:", error);
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/advertise/my-submissions - Fetch user's own ad submissions
export const getMyAdSubmissions = async (req, res) => {
  try {
    const submissions = await Advertise.find({
      user: req.user.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "User ad submissions retrieved.", { submissions });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/advertise/active - Fetch active approved ads (Supports filtering by ?placement=ad1)
export const getActiveAds = async (req, res) => {
  try {
    const now = new Date();
    const { placement } = req.query;

    const query = {
      status: "Approved",
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (placement && ["ad1", "ad2", "ad3"].includes(placement)) {
      query.placement = placement;
    }

    const activeAds = await Advertise.find(query).select(
      "adTitle bannerImage targetUrl placement startDate endDate"
    );

    return res.status(200).json({
      success: true,
      message: "Active advertisements retrieved.",
      ads: activeAds,
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/advertise/all - Fetch all submissions (Admin)
export const getAllAdSubmissions = async (req, res) => {
  try {
    const submissions = await Advertise.find({ isDeleted: false })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "All ad submissions retrieved.", { submissions });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// PATCH /api/advertise/:id/status - Approve or Reject Ad (Admin)
export const updateAdStatus = async (req, res) => {
  try {
    const { status, adminRemarks, placement, startDate, endDate } = req.body;
    const { id } = req.params;

    if (!["Approved", "Rejected", "Pending", "Expired"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value.");
    }

    const ad = await Advertise.findById(id);
    if (!ad) {
      return sendResponse(res, 404, false, "Advertisement request not found.");
    }

    ad.status = status;
    if (adminRemarks !== undefined) ad.adminRemarks = adminRemarks;

    if (status === "Approved") {
      // Validate & Update placement slot if explicitly chosen by Admin
      if (placement && ["ad1", "ad2", "ad3"].includes(placement)) {
        ad.placement = placement;
      }

      // Use Admin-selected start and end dates from calendar pickers
      const start = startDate ? new Date(startDate) : new Date();
      let end;

      if (endDate) {
        end = new Date(endDate);
      } else {
        end = new Date(start);
        end.setDate(end.getDate() + (ad.durationDays || 7));
      }

      ad.startDate = start;
      ad.endDate = end;
    }

    await ad.save();

    return sendResponse(res, 200, true, `Advertisement status updated to ${status}.`, { ad });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// DELETE /api/advertise/:id - Soft Delete Ad (Admin)
export const deleteAdSubmission = async (req, res) => {
  try {
    const ad = await Advertise.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!ad) return sendResponse(res, 404, false, "Advertisement request not found.");
    return sendResponse(res, 200, true, "Advertisement request deleted cleanly.");
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
