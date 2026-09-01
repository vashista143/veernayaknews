import mongoose from "mongoose";

const newspaperAdSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    contactName: {
      type: String,
      required: [true, "Contact person name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    adType: {
      type: String,
      enum: ["Classified Text", "Classified Display", "Display Ad"],
      default: "Display Ad",
    },
    editionRegion: {
      type: String,
      required: [true, "Edition/Region is required"],
      trim: true,
    },
    publishDate: {
      type: Date,
      required: [true, "Publish date is required"],
    },
    adContent: {
      type: String,
      required: [true, "Ad content text is required"],
      trim: true,
    },
    placement: {
      type: String,
      required: [true, "Ad placement selection is required"],
      enum: [
        "fp_full",
        "fp_half",
        "fp_quarter",
        "fp_2col",
        "fp_custom",
        "lp_full",
        "lp_half",
        "lp_quarter",
      ],
    },
    customCm: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total calculated amount is required"],
    },
    artworkImage: {
      type: String,
      required: [true, "Artwork image is required"],
    },
    paymentReceipt: {
      type: String,
      required: [true, "Payment verification proof receipt is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending Verification", "Verified", "Failed"],
      default: "Pending Verification",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Published"],
      default: "Pending",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

newspaperAdSchema.index({ user: 1 });
newspaperAdSchema.index({ status: 1 });

export default mongoose.model("NewspaperAd", newspaperAdSchema);
