const express = require("express");
const {
  createApplication,
  updateApplication,
  getApplication,
  getAllApplications,
  deleteApplication,
} = require("../controllers/applicationController");
const { landlordAuthMiddleware, isLandlord } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/create-application",
  landlordAuthMiddleware,
  isLandlord,
  createApplication
);

router.put(
  "/update-application",
  landlordAuthMiddleware,
  isLandlord,
  updateApplication
);

router.get("/get-application/:id", landlordAuthMiddleware, isLandlord, getApplication);
router.get(
  "/get-all-applications",
  landlordAuthMiddleware,
  isLandlord,
  getAllApplications
);

router.delete(
  "/delete-application/:id",
  landlordAuthMiddleware,
  isLandlord,
  deleteApplication
);

module.exports = router;
