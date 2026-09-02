import Advertise from "../models/Advertise.js";
import { uploadToR2 } from "../config/r2.js";

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, ...data });
};

const SLOT_PRICES = {
  ad1: 4000,
  ad2: 2000,
  ad3: 1000,
};

// ==========================================
// USER ENDPOINTS
// ==========================================

// POST /api/advertise - Submit a new In-App Advertisement request
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
      totalAmount,
    } = req.body;

    if (!businessName || !contactName || !email || !phone || !adTitle) {
      return sendResponse(res, 400, false, "Please fill in all required fields.");
    }

    // Validate uploaded files from Multer fields
    const bannerFile = req.files?.bannerImage?.[0];
    const receiptFile = req.files?.paymentReceipt?.[0];

    if (!bannerFile) {
      return sendResponse(res, 400, false, "Advertisement banner image is required.");
    }

    if (!receiptFile) {
      return sendResponse(res, 400, false, "Payment proof receipt screenshot is required.");
    }

    // Validate placement slot
    const validPlacements = ["ad1", "ad2", "ad3"];
    const finalPlacement = validPlacements.includes(placement) ? placement : "ad1";
    const finalAmount = Number(totalAmount) || SLOT_PRICES[finalPlacement] || 4000;

    // Upload both banner and payment proof to Cloudflare R2
    const [bannerImageUrl, paymentReceiptUrl] = await Promise.all([
      uploadToR2({
        originalname: bannerFile.originalname,
        buffer: bannerFile.buffer,
        mimetype: bannerFile.mimetype,
      }),
      uploadToR2({
        originalname: receiptFile.originalname,
        buffer: receiptFile.buffer,
        mimetype: receiptFile.mimetype,
      }),
    ]);

    const newAd = await Advertise.create({
      user: req.user.id,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      adTitle: adTitle.trim(),
      description: (description || "").trim(),
      targetUrl: (targetUrl || "").trim(),
      placement: finalPlacement,
      durationDays: 7, // Fixed 7 days validity
      totalAmount: finalAmount,
      bannerImage: bannerImageUrl,
      paymentReceipt: paymentReceiptUrl,
      paymentStatus: "Pending Verification",
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

// GET /api/advertise/active - Fetch active approved ads
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
    const { status, paymentStatus, adminRemarks, placement, startDate, endDate } = req.body;
    const { id } = req.params;

    if (status && !["Approved", "Rejected", "Pending", "Expired"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status value.");
    }

    if (paymentStatus && !["Pending Verification", "Verified", "Failed"].includes(paymentStatus)) {
      return sendResponse(res, 400, false, "Invalid payment status value.");
    }

    const ad = await Advertise.findById(id);
    if (!ad) {
      return sendResponse(res, 404, false, "Advertisement request not found.");
    }

    if (status) ad.status = status;
    if (paymentStatus) {
      ad.paymentStatus = paymentStatus;
    } else if (status === "Approved") {
      ad.paymentStatus = "Verified";
    } else if (status === "Rejected") {
      ad.paymentStatus = "Failed";
    }

    if (adminRemarks !== undefined) ad.adminRemarks = adminRemarks;

    if (status === "Approved") {
      if (placement && ["ad1", "ad2", "ad3"].includes(placement)) {
        ad.placement = placement;
      }

      const start = startDate ? new Date(startDate) : new Date();
      let end;

      if (endDate) {
        end = new Date(endDate);
      } else {
        end = new Date(start);
        end.setDate(end.getDate() + 7); // Default 7 days
      }

      ad.startDate = start;
      ad.endDate = end;
    }

    await ad.save();

    return sendResponse(res, 200, true, `Advertisement status updated to ${ad.status}.`, { ad });
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
