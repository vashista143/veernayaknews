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
      placement: placement || "Home Banner",
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

// GET /api/advertise/active - Fetch approved ads for public display in app
export const getActiveAds = async (req, res) => {
  try {
    const activeAds = await Advertise.find({
      status: "Approved",
      isDeleted: false,
    }).select("adTitle bannerImage targetUrl placement");

    return sendResponse(res, 200, true, "Active advertisements retrieved.", { ads: activeAds });
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
    const { status, adminRemarks, startDate } = req.body;
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
      const start = startDate ? new Date(startDate) : new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (ad.durationDays || 7));

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