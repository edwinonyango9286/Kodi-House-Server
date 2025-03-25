const express = require("express")
const { verifyUserToken, checkUserRole } = require("../middlewares/authMiddleware")
const { createAPropertyTag, getAPropertyTag, deleteAPropertyTag, getAllPropertyTags, updateAPropertyTag } = require("../controllers/propertyTagControllers")

const router = express.Router()

router.post("/create", verifyUserToken,checkUserRole(["Admin"]), createAPropertyTag)
router.get("/:propertyTagId", getAPropertyTag)
router.patch("/:propertyTagId/delete", verifyUserToken, checkUserRole(["Admin"]), deleteAPropertyTag )
router.get("/property-tags/get", getAllPropertyTags)
router.patch("/:propertyTagId/update", verifyUserToken, checkUserRole(["Admin"]), updateAPropertyTag,)


module.exports = router