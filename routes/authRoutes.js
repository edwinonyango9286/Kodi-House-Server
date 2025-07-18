const express = require("express");
const { registerNewUser, activateAdminAccount, activateLandlordAccount, activateTenantAccount, signInAdmin, signInTenant, signInLandlord, refreshUserAccessToken, updatePassword, resetPassword, passwordResetToken, logout, googleAuthCallback } = require("../controllers/authController");
const { verifyUserToken } = require("../middlewares/authMiddleware");
const passport = require("passport");

const router = express.Router();
const nodeEnvironment = process.env.NODE_ENV

router.post("/register", registerNewUser);
router.post("/activate-landlord", activateLandlordAccount);
router.post("/activate-tenant", activateTenantAccount);
router.post("/activate-admin", activateAdminAccount);
router.post("/sign-in-landlord", signInLandlord);
router.post("/sign-in-admin", signInAdmin);
router.post("/sign-in-tenant", signInTenant);
router.post("/refresh-access-token", refreshUserAccessToken);
router.post("/password-reset-token", passwordResetToken);
router.put("/update-password",verifyUserToken,updatePassword, );
router.put("/reset-password/:token", resetPassword);
router.post("/logout", logout);


// Google authentication
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/" }), googleAuthCallback);

// Facebook authentication
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => { res.status(200).json({ status: "SUCCESS", message: "Logged in with Facebook successfully.", user: req.user })});

// Twitter authentication
router.get("/twitter", passport.authenticate("twitter"));
router.get("/twitter/callback", passport.authenticate("twitter", { failureRedirect: "/login" }), (req, res) => { res.status(200).json({ status: "SUCCESS", message: "Logged in with Twitter successfully.", user: req.user })});

// Apple authentication
router.get("/apple", passport.authenticate("apple"));
router.post("/apple/callback", passport.authenticate("apple", { failureRedirect: "/login" }), (req, res) => { res.status(200).json({ status: "SUCCESS", message: "Logged in with Apple successfully.", user: req.user })});

module.exports = router;
