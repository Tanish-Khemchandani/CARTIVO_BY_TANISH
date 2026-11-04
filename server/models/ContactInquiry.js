const mongoose = require("mongoose");

const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["NEW", "READ", "IN_PROGRESS", "RESOLVED", "ARCHIVED"],
      default: "NEW",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactInquiry", contactInquirySchema);
