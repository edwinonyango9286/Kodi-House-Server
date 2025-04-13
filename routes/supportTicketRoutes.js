const express = require("express")
const {verifyUserToken, checkUserRole} = require("../middlewares/authMiddleware")
const { createASupportTicket, updateASupportTicket, deleteASupportTicket, getAllSupportTickets, getASupportTicket } = require("../controllers/supportTicketControllers")

const router = express.Router()
router.post("/create",verifyUserToken, checkUserRole(["Admin"]), createASupportTicket)
router.patch("/:supportTicketId/update", verifyUserToken, checkUserRole(["Admin"]), updateASupportTicket)
router.patch("/:supportTicketId/delete", verifyUserToken, checkUserRole(["Admin"]),deleteASupportTicket )
router.get("/supportTickets/get", getAllSupportTickets)
router.get("/:supportTicketId", getASupportTicket)

module.exports = router