const express = require("express");
const {
  createApplication,
  updateApplication,
  getApplication,
  getAllApplications,
  deleteApplication,
} = require("../controllers/applicationController");
const { landlordAuthMiddleware, isAValidLandlord } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/create-application",
  landlordAuthMiddleware,
  isAValidLandlord,
  createApplication
);

router.put(
  "/update-application",
  landlordAuthMiddleware,
  isAValidLandlord,
  updateApplication
);

router.get("/get-application/:id", landlordAuthMiddleware, isAValidLandlord, getApplication);
router.get(
  "/get-all-applications",
  landlordAuthMiddleware,
  isAValidLandlord,
  getAllApplications
);

router.delete(
  "/delete-application/:id",
  landlordAuthMiddleware,
  isAValidLandlord,
  deleteApplication
);

module.exports = router;
