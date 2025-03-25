const express = require("express");
const {
  registerNewUser,
  activateAdminAccount,
  activateLandlordAccount,
  activateTenantAccount,
  signInAdmin,
  signInTenant,
  signInLandlord,
  refreshUserAccessToken,
  updatePassword,
  resetPassword,
  passwordResetToken,
  logout,
} = require("../controllers/authController");

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 description: The username of the new user
 *               email:
 *                 type: string
 *                 description: The email address of the new user
 *               password:
 *                 type: string
 *                 description: The password for the new user
 *               termsAndConditionsAccepted:
 *                 type: boolean
 *                 description: Indicates whether the user has accepted the terms and conditions
 *     responses:
 *       200:
 *         description: An account activation code has been sent to the user's email.
 *       400:
 *         description: Invalid input data or missing required fields.
 *       409:
 *         description: An account with this email address already exists.
 */
router.post("/register", registerNewUser);

/**
 * @swagger
 * /api/v1/auth/activate_landlord:
 *   post:
 *     summary: Activate new a landlord account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activationToken:
 *                 type: string
 *                 description: Account activation token
 *               activationCode:
 *                 type: number
 *                 description: Account activation code sent to user email
 *     responses:
 *       201:
 *         description: Your account has been successfully activated. Please proceed to log in.
 *       400:
 *         description: Missing required fields/expired activation token/invalid activation code/activation token has expired.
 *       404:  # Corrected indentation here
 *         description: Role not found.
 *       409:
 *         description: An account with this email address already exists. Please use a different email address or log in to your existing account.
 */

router.post("/activate-landlord", activateLandlordAccount);
router.post("/activate-tenant", activateTenantAccount);
router.post("/activate-admin", activateAdminAccount);
router.post("/sign-in-landlord", signInLandlord);
router.post("/sign-in-admin", signInAdmin);
router.post("/sign-in-tenant", signInTenant);
router.post("/refresh-access-token", refreshUserAccessToken);
router.post("/password-reset-token", passwordResetToken);
router.put("/update-password", updatePassword);
router.put("/reset-password/:token", resetPassword);
router.post("/logout", logout);

module.exports = router;
