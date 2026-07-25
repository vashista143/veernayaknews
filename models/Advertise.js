import mongoose from "mongoose";

const advertiseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: [true, "Business or brand name is required"],
      trim: true,
    },
    contactName: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Contact phone number is required"],
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
    bannerImage: {
      type: String,
      required: [true, "Advertisement banner image is required"],
    },
    targetUrl: {
      type: String,
      trim: true,
      default: "",
    },
    placement: {
      type: String,
      enum: ["ad1", "ad2", "ad3"],
      default: "ad1",
    },
    durationDays: {
      type: Number,
      required: true,
      default: 7,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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

advertiseSchema.index({ user: 1 });
advertiseSchema.index({ status: 1 });

export default mongoose.model("Advertise", advertiseSchema);
