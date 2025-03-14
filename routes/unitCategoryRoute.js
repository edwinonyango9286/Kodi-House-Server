const express = require("express");
const {landlordAuthMiddleware,isAValidLandlord,} = require("../middlewares/authMiddleware");
const {addAUnitCategory,getAllUnitCategories} = require("../controllers/unitCategoryController");
const router = express.Router();
router.post("/add_a_unit_category",landlordAuthMiddleware,isAValidLandlord,addAUnitCategory);
router.get("/get_all_unit_categories",landlordAuthMiddleware,isAValidLandlord,getAllUnitCategories);

module.exports = router;
