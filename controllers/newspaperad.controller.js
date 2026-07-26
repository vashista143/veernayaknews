import NewspaperAd from "../models/NewspaperAd.js";
import { uploadToR2 } from "../config/r2.js";

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

// POST /api/newspaper-ad - Submit a new Newspaper Advertisement
export const createNewspaperAd = async (req, res) => {
  try {
    const {
      businessName,
      contactName,
      email,
      phone,
      adType,
      editionRegion,
      publishDate,
      adContent,
    } = req.body;

    if (!businessName || !contactName || !email || !phone || !editionRegion || !publishDate || !adContent) {
      return sendResponse(res, 400, false, "Please fill in all required fields.");
    }

    let artworkImageUrl = "";
    if (req.file) {
      artworkImageUrl = await uploadToR2(req.file);
    }

    const newAd = await NewspaperAd.create({
      user: req.user.id,
      businessName,
      contactName,
      email,
      phone,
      adType: adType || "Classified Text",
      editionRegion,
      publishDate: new Date(publishDate),
      adContent,
      artworkImage: artworkImageUrl,
      status: "Pending",
    });

    return sendResponse(res, 201, true, "Newspaper advertisement request submitted successfully.", {
      ad: newAd,
    });
  } catch (error) {
    console.error("Create Newspaper Ad Error:", error);
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/newspaper-ad/my-submissions - Fetch user's own submissions
export const getMyNewspaperAds = async (req, res) => {
  try {
    const submissions = await NewspaperAd.find({
      user: req.user.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "User newspaper ad submissions retrieved.", { submissions });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// GET /api/newspaper-ad/all - Fetch all submissions (Admin)
export const getAllNewspaperAds = async (req, res) => {
  try {
    const submissions = await NewspaperAd.find({ isDeleted: false })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "All newspaper ad submissions retrieved.", { submissions });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// PATCH /api/newspaper-ad/:id/status - Update Status (Admin)
export const updateNewspaperAdStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const { id } = req.params;

    if (!["Approved", "Rejected", "Pending", "Published"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value.");
    }

    const ad = await NewspaperAd.findById(id);
    if (!ad) {
      return sendResponse(res, 404, false, "Newspaper advertisement request not found.");
    }

    ad.status = status;
    if (adminRemarks !== undefined) ad.adminRemarks = adminRemarks;

    await ad.save();

    return sendResponse(res, 200, true, `Newspaper ad status updated to ${status}.`, { ad });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};