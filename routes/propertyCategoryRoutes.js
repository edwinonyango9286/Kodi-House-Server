const express = require("express");
const {addAPropertyCategory,getAllPropertyCategories} = require("../controllers/propertyCategoryController");
const { checkUserRole, verifyUserToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", verifyUserToken, checkUserRole(["Admin","Landlord"]), addAPropertyCategory);
router.get("/list/property-categories",verifyUserToken, checkUserRole(["Admin","Landlord"]), getAllPropertyCategories);

module.exports = router;
