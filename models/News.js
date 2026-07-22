import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    images: [{ type: String }],
    video: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Punjab",
        "India",
        "World",
        "Politics",
        "Business",
        "Sports",
        "Technology",
        "Entertainment",
        "Education",
        "Health",
        "Crime",
        "Lifestyle",
      ],
    },
    subCategory: {
      type: String,
      default: "",
    },
    tags: [{ type: String }],
    country: {
      type: String,
      default: "India",
    },
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    city: { type: String, default: "" },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporterName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Published", "Rejected", "Archived"],
      default: "Draft",
    },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    isBreaking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isTopStory: { type: Boolean, default: false },
    isEditorsPick: { type: Boolean, default: false },
    readTime: { type: Number, default: 3 },
    language: { type: String, default: "English" },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    comments: [commentSchema], // Embedded schema to manage interactions natively
    commentsCount: { type: Number, default: 0 },
    relatedNews: [{ type: mongoose.Schema.Types.ObjectId, ref: "News" }],
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: [{ type: String }],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalRemarks: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

newsSchema.pre("validate", function () {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
});

newsSchema.index({ title: "text", shortDescription: "text", content: "text" });
newsSchema.index({ slug: 1 });
newsSchema.index({ category: 1 });
newsSchema.index({ tags: 1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ views: -1 });
newsSchema.index({ isBreaking: 1 });
newsSchema.index({ isTrending: 1 });

export default mongoose.model("News", newsSchema);