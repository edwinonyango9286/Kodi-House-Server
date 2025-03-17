const express = require("express");
const {addAPropertyCategory,getAllPropertyCategories} = require("../controllers/propertyCategoryController");

const router = express.Router();

router.post("/add_a_property_category",addAPropertyCategory);
router.get("/get_all_property_categories",getAllPropertyCategories);

module.exports = router;
