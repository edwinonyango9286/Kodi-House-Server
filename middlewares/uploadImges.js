const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "../public/images/"));
  },

  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, file.fieldname + "-" + uniqueSuffix + ".jpeg");
  },
});

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith("image")) {
    callback(null, true);
  } else {
    callback({ status: "FAILED", message: "Unsupported file format." }, false);
  }
};

const uploadImage = multer({
  storage: storage,
  fileFilter: multerFilter,
  // file size set to 1mb
  limits: { fileSize: 1048576 },
});

const propertyImageResize = async (req, res, next) => {
  if (!req.files) return next();
  await Promises.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/properties/${file.filename}`);
      fs.unlinkSync(`public/images/properties/${file.filename}`);
    })
  );
  next();
};

module.exports = { uploadImage, propertyImageResize };
