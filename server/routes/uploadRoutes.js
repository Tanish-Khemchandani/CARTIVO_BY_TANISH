const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { uploadImages, productPhotoBucket } = require("../controllers/imageUploadController");
const { requireAdmin, requireWritableAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

// memory storage: the controller validates magic bytes/dimensions before any
// byte touches the disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 }, // controller applies its own tighter limits
});

function imageContentType(file) {
  if (file.contentType?.startsWith("image/")) return file.contentType;
  if (file.metadata?.contentType?.startsWith("image/")) return file.metadata.contentType;
  const extension = String(file.filename || "").split(".").pop().toLowerCase();
  return extension === "jpg" || extension === "jpeg" ? "image/jpeg"
    : extension === "png" ? "image/png"
      : extension === "webp" ? "image/webp"
        : extension === "svg" ? "image/svg+xml" : "application/octet-stream";
}

router.post("/", requireAdmin, requireWritableAdmin, upload.array("images", 8), uploadImages);

// Product images are public catalog assets; their bytes remain in MongoDB.
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
    const bucket = productPhotoBucket();
    const id = new mongoose.Types.ObjectId(req.params.id);
    const files = await bucket.find({ _id: id }).toArray();
    if (!files[0]) return res.status(404).end();
    res.type(imageContentType(files[0]));
    bucket.openDownloadStream(id).on("error", next).pipe(res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
