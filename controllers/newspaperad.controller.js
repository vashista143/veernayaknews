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
      placement,
      customCm,
      totalAmount,
    } = req.body;

    if (
      !businessName ||
      !contactName ||
      !email ||
      !phone ||
      !editionRegion ||
      !publishDate ||
      !adContent ||
      !placement ||
      totalAmount === undefined
    ) {
      return sendResponse(res, 400, false, "Please fill in all required fields.");
    }

    // Validate files
    const artworkFile = req.files?.artworkImage?.[0];
    const receiptFile = req.files?.paymentReceipt?.[0];

    if (!artworkFile) {
      return sendResponse(res, 400, false, "Artwork / layout image is required.");
    }

    if (!receiptFile) {
      return sendResponse(res, 400, false, "Payment proof receipt image is required.");
    }

    // Upload both assets to Cloudflare R2
    const [artworkImageUrl, paymentReceiptUrl] = await Promise.all([
      uploadToR2(artworkFile),
      uploadToR2(receiptFile),
    ]);

    const newAd = await NewspaperAd.create({
      user: req.user.id,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      adType: adType || "Display Ad",
      editionRegion: editionRegion.trim(),
      publishDate: new Date(publishDate),
      adContent: adContent.trim(),
      placement,
      customCm: Number(customCm) || 0,
      totalAmount: Number(totalAmount),
      artworkImage: artworkImageUrl,
      paymentReceipt: paymentReceiptUrl,
      paymentStatus: "Pending Verification",
      status: "Pending",
    });

    return sendResponse(
      res,
      201,
      true,
      "Newspaper advertisement and payment verification submitted successfully.",
      { ad: newAd }
    );
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
    const { status, paymentStatus, adminRemarks } = req.body;
    const { id } = req.params;

    if (status && !["Approved", "Rejected", "Pending", "Published"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid ad status value.");
    }

    if (paymentStatus && !["Pending Verification", "Verified", "Failed"].includes(paymentStatus)) {
      return sendResponse(res, 400, false, "Invalid payment status value.");
    }

    const ad = await NewspaperAd.findById(id);
    if (!ad) {
      return sendResponse(res, 404, false, "Newspaper advertisement request not found.");
    }

    if (status) ad.status = status;
    if (paymentStatus) ad.paymentStatus = paymentStatus;
    if (adminRemarks !== undefined) ad.adminRemarks = adminRemarks;

    await ad.save();

    return sendResponse(res, 200, true, `Newspaper ad updated successfully.`, { ad });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
