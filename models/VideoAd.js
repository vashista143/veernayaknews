import mongoose from "mongoose";

const videoAdSchema = new mongoose.Schema(
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
    adTitle: {
      type: String,
      required: [true, "Advertisement title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    targetUrl: {
      type: String,
      trim: true,
      default: "",
    },
    videoUrl: {
      type: String,
      required: [true, "Promotional video file or link is required"],
    },
    totalAmount: {
      type: Number,
      default: 3000,
    },
    paymentReceipt: {
      type: String,
      required: [true, "Payment proof receipt is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending Verification", "Verified", "Failed"],
      default: "Pending Verification",
    },
    durationSeconds: {
      type: Number,
      default: 30,
    },
    isAd: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Expired"],
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

videoAdSchema.index({ user: 1 });
videoAdSchema.index({ status: 1 });
videoAdSchema.index({ isAd: 1 });

export default mongoose.model("VideoAd", videoAdSchema);
