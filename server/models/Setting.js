const mongoose = require("mongoose");

/*
 * Site settings. There is exactly one document; getSettings() creates the
 * default one on first read so the admin panel and footer always have data.
 * These fields are all public by nature and are served to the storefront.
 */
const settingSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "CARTIVO", trim: true },
    tagline: {
      type: String,
      default: "Your trusted destination for premium products, delivered fast and securely across India.",
      trim: true,
    },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    contactPhone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    supportHours: { type: String, default: "Mon - Sat: 9:00am - 6:00pm", trim: true },
    footerText: { type: String, default: "Made with care for Bharat", trim: true },
    social: {
      facebook: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
      twitter: { type: String, default: "", trim: true },
      youtube: { type: String, default: "", trim: true },
    },
  },
  { timestamps: true }
);

// find the single settings document, creating it with schema defaults if absent
settingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model("Setting", settingSchema);
