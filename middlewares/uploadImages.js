const multer = require("multer");

const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({ status: "FAILED", message: "Unsupported file format" }, false);
  }
};

const uploadImage = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB file size limit
});

module.exports = { uploadImage };