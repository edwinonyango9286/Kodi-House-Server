const express = require("express");
const {addAUnitCategory,getAllUnitCategories} = require("../controllers/unitCategoryController");
const router = express.Router();
router.post("/add_a_unit_category",addAUnitCategory);
router.get("/get_all_unit_categories",getAllUnitCategories);

module.exports = router;
