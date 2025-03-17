const express = require("express");
const {createApplication,updateApplication,getApplication,getAllApplications,deleteApplication} = require("../controllers/applicationController");

const router = express.Router();

router.post("/create-application",createApplication);
router.put("/update-application",updateApplication);
router.get("/get-application/:id", getApplication);
router.get("/get-all-applications",getAllApplications);
router.delete("/delete-application/:id",deleteApplication);

module.exports = router;
