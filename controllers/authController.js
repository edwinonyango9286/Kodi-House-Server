const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const emailValidator = require("email-validator");
const validatePassword = require("../utils/validatePassword");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMails");
const { generateAccessToken } = require("../config/accessToken");
const { generateRefreshToken } = require("../config/refreshToken");
const crypto = require("crypto");
const User = require("../models/userModel");
const logger = require("../utils/logger");
const _ = require("lodash");
const Role = require("../models/roleModel");
const sendSMS = require("../utils/sendSms");
const passport = require("passport");

//create user activation token
const createActivationToken = (user) => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const token = jwt.sign({user,activationCode}, process.env.ACTIVATION_SECRET,{expiresIn: "5min"});
  return { token, activationCode };
};

//  Register a new user
const registerNewUser = asyncHandler(async (req, res, next) => {
  try {
    const { userName, email, password, termsAndConditionsAccepted } = req.body;
    // check for required fields
    if (!userName || !email || !password || !termsAndConditionsAccepted) {
      return res.status(400).json({status: "FAILED",message: "Please provide all the required fields."});
    }
    // validate user email
    if (!emailValidator.validate(email)) {
      return res.status(400).json({status: "FAILED",message: "Please provide a valid email address."});
    }
    validatePassword(password);
    // check if the user already exist in the database using email.
    const user = await User.findOne({ email });
    if (user) {return res.status(409).json({status: "FAILED",message:"An account with this email address already exists. Please use a different email address or log in to your existing account.",})}
    const newUser = {userName,email,password,termsAndConditionsAccepted};
    const activationToken = createActivationToken(newUser);
    const activationCode = activationToken.activationCode;
    const data = {newUser: { userName: newUser?.userName },activationCode};
    await sendMail({email: newUser?.email,subject: "Account Activation",template: "account-activation-mail.ejs",data});
    return res.status(200).json({success:"SUCCESS", message: `An account activation code has been sent to ${newUser?.email}. Please check it.`,  data:{ activationToken: activationToken?.token, email:newUser.email } });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});


// General function to activate user accounts
const activateUserAccount = asyncHandler(async (req, res, next, roleName) => {
  try {
    const { activationToken, activationCode } = req.body;
    if (!activationToken || !activationCode) {
      return res.status(400).json({status: "FAILED",message: "Please provide all the required fields."});
    }
    let newUser;
    try {
      newUser = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ status: "FAILED", message: "Activation token has expired." });
      }
      return res.status(400).json({ status: "FAILED", message: "Invalid activation token." });
    }
    if (newUser.activationCode !== activationCode) {
      return res.status(400).json({ status: "FAILED", message: "Invalid activation code" });
    }
    const { userName, email, password, termsAndConditionsAccepted } =
      newUser.user;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({status: "FAILED",message:"An account with this email address already exists. Please use a different email address or log in to your existing account."});
    }

    // Fetch the role ObjectId based on the role name
    const role = await Role.findOne({ name: _.startCase(_.toLower(roleName)) });
    if (!role) { return res.status(404).json({status: "FAILED",message: " User role not found."})}
    
    const user = await User.create({
    userName: _.startCase(_.toLower(userName)),email,password,termsAndConditionsAccepted,role: role._id});
    return res.status(200).json({status: "SUCCESS",message:"Your account has been successfully activated. Please proceed to log in.",});
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

const activateAdminAccount = (req, res, next) => activateUserAccount(req, res, next, "Admin");
const activateLandlordAccount = (req, res, next) => activateUserAccount(req, res, next, "Landlord");
const activateTenantAccount = (req, res, next) =>activateUserAccount(req, res, next, "Tenant");

// for a landlord to start using his/her account the landlord should be verified
const verifyLandlordAccount = asyncHandler(async (req, res) => {
  try {
    const { landlordId } = req.params;
    validateMongoDbId(landlordId);
    const verifiedLandlord = await User.findOneAndUpdate({_id: landlordId,},{ isAccountVerrified: true });
    if (!verifiedLandlord) { return res.status(404).json({ status: "Failed", message: "Landlord not found." })}
    return res.status(200).json({ status: "SUCCESS", message: "Landlord account activated successfully.",data: verifiedLandlord });
  } catch (error) {
    logger.error({ message: error.message });
    return res.status(500).json({ message: error.message });
  }
});

// General sign-in function
const signInUser = asyncHandler(async (req, res, next, expectedRole) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { return res.status(400).json({status: "FAILED", message: "Please provide all the required fields.",});}
    if (!emailValidator.validate(email)) {return res.status(400).json({ status: "FAILED",message: "Please provide a valid email address.",});}
    const user = await User.findOne({ email,isDeleted: false,deletedAt: null,}).select("+password").populate({ path: "role", select: "name" });
    if (!user || user.role.name !== expectedRole) {return res.status(404).json({status: "FAILED",message: `${expectedRole} account not found.`});}
    if (!(await user.isPasswordMatched(password))) {return res.status(401).json({status: "FAILED",message: "Wrong email or password."});}
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV=== "production" ? "none" : "lax",
      maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
      // domain: process.env.NODE_ENV === "production"? ".onrender.com" : undefined ,
      // path: "/"
    });
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    return res.status(200).json({status: "SUCCESS", message: `${expectedRole} signed in successfully.`,data: userData,accessToken,});
    
  } catch (error) {
    next(error);
  }
});


const signInAdmin = (req, res, next) => signInUser(req, res, next, "Admin");
const signInLandlord = (req, res, next) => signInUser(req, res, next, "Landlord");
const signInTenant = (req, res, next) => signInUser(req, res, next, "Tenant");

const nodeEnvironment = process.env.NODE_ENV;
passport.use(
  new (require("passport-google-oauth20").Strategy)(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: nodeEnvironment === "production" ? process.env.PROD_CALLBACK_URL : process.env.DEV_CALLBACK_URL,
      passReqToCallback: true,
      scope: ["profile", "email"],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id }).populate("role","name");
        if (user) { return done(null, user)}

        user = await User.findOne({ email: profile.emails[0].value }).populate("role","name");
        if (user) {
          user.googleId = profile.id;
          user.userName = user.userName || profile.displayName;
          user.avatar = user.avatar.secure_url ? user.avatar : { secure_url: profile.photos[0].value };
          await user.save();
          return done(null, user);
        }

        // Get landlordRole 
         const userRole = await Role.findOne({ name:"Landlord" });
         if(!userRole){ return done(new Error("User role not found"), false)}

        const newUser = await User.create({
          googleId: profile.id,
          userName: profile.displayName,
          email: profile.emails[0].value,
          avatar: { secure_url: profile.photos[0].value },
          firstName:profile.name.givenName,
          secondName:profile.name.familyName,
          role:userRole._id,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

const googleAuthCallback = asyncHandler(async (req, res) => {
  const user = req.user;

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE),
  });

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  const redirectURL = nodeEnvironment === "production" ? `${process.env.KODI_HOUSE_LANDLORDAPP_DEV_URL}/auth/callback` : `${process.env.ORIGIN_LANDLORDAPP_LOCAL_5173}/auth/callback`;
  res.redirect(`${redirectURL}?user=${encodeURIComponent(JSON.stringify(userData))}&accessToken=${accessToken}`);
});


passport.use(
  new (require("passport-facebook").Strategy)(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });
        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          user.facebookId = profile.id;
          user.userName = user.userName || profile.displayName;
          user.avatar = user.avatar.secure_url
            ? user.avatar
            : { secure_url: profile.photos[0].value };
          await user.save();
          return done(null, user);
        }

        const newUser = await User.create({
          facebookId: profile.id,
          userName: profile.displayName,
          email: profile.emails[0].value,
          avatar: { secure_url: profile.photos[0].value },
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.use(
  new (require("passport-twitter").Strategy)(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL,
      includeEmail: true,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ twitterId: profile.id });
        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          user.twitterId = profile.id;
          user.userName = user.userName || profile.displayName;
          user.avatar = user.avatar.secure_url
            ? user.avatar
            : { secure_url: profile.photos[0].value };
          await user.save();
          return done(null, user);
        }

        const newUser = await User.create({
          twitterId: profile.id,
          userName: profile.displayName,
          email: profile.emails[0].value,
          avatar: { secure_url: profile.photos[0].value },
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.use(
  new (require("passport-apple").Strategy)(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
      callbackURL: process.env.APPLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, idToken, profile, done) => {
      try {
        let user = await User.findOne({ appleId: profile.id });
        if (user) {
          return done(null, user);
        }

        const email = profile.email || idToken.email;
        user = await User.findOne({ email });

        if (user) {
          user.appleId = profile.id;
          await user.save();
          return done(null, user);
        }

        const newUser = await User.create({
          appleId: profile.id,
          email: email,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

const refreshUserAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) { return res.status(400).json({status: "FAILED", message: "Session expired. Please log in to continue." })}
    const user = await User.findOne({ refreshToken }).select("+refreshToken");
    if (!user) {
      return res.status(400).json({ status: "FAILED", message: "Invalid refresh token." })}
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (user.id !== decoded.id) { return res.status(400).json({ status: "FAILED", message: "Unauthorized access. Please log in to continue." }) }
    const newAccessToken = generateAccessToken(user._id);
    req.user = user;
    return newAccessToken; 
  } catch (error) {
    next(error);
  }
});

// update password
const updatePassword = asyncHandler(async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) { return res.status(400).json({ status: "FAILED", message: "Please fill in all the required fields.",})}
    validatePassword(currentPassword);
    validatePassword(newPassword);
    validatePassword(confirmNewPassword);

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ status: "FAILED", message: "Password and confirm password values do not match.",});
    }
    const user = await User.findById(req.user._id).select("+password");

    if (!user) { return res.status(404).json({ status: "FAILED",message: "User not found.",});}
    // check if the current password is the same as the stored password
    if (!(await user.isPasswordMatched(currentPassword))) {return res.status(400).json({ status: "FAILED", message: "Current password is incorrect." });}

    // check if the new password is the same as the stored password
    if (await user.isPasswordMatched(newPassword)) {
      return res.status(400).json({status: "FAILED",message:"Please choose a new password that is different from the old password.",});
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({status: "SUCCESS", message:"Your password has been successfully updated.Please proceed to sign in with the new password.",});
  } catch (error) {
    next(error);
  }
});



// send an email to the user with the password reset link and a token
const passwordResetToken = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({status: "FAILED",message: "Please provide your email address.",});
    }
    if (!emailValidator.validate(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    const user = await User.findOne({ email });
      if (!user) { return res.status(404).json({status: "FAILED",message:"We couldn't find an account associated with this email address. Please double-check your email address and try again.",});
    }
    const token = await user.createPasswordResetToken();
    await user.save();
    const data = { user: { userName: user.userName }, token };
    await sendMail({ email: user.email, subject: "Password Reset Link", template: "reset-password-token-mail.ejs", data,});
    return res.status(200).json({ status: "SUCCESS", message: `A password reset link has been sent to ${user.email}. Please check your email inbox and follow the instructions to reset your password.`});
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
});

const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) { return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields.",});}
    validatePassword(password);
    validatePassword(confirmPassword);
    if (password !== confirmPassword) { return res.status(400).json({ status: "FAILED", message: "Password and confirm password values do not match.",});}
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() },}).select("+password");
    console.log(user,"=>user")
    if (!user) { return res.status(400).json({ status: "FAILED", message: "Invalid password reset token.",});}
    if (await user.isPasswordMatched(password)) { return res.status(400).json({ status: "FAILED", message:"Please choose a new password that is different from the old one.",});}
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.json({  status: "SUCCESS", message:"Your password has been successfully reset. Please proceed to sign in with the new password.",});
  } catch (error) {
    next(error);
  }
});

const logout = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) { return res.status(401).json({status: "FAILED", message: "No refresh token found in cookies." })}

    const user = await User.findOneAndUpdate({ refreshToken }, { refreshToken: null },{ new: true }).select("+refreshToken");
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV ==="production", 
      sameSite: process.env.NODE_ENV==="production" ? "none" : "lax",
      // domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
      // path: "/"
    });
    return res.status(200).json({ status: "SUCCESS",  message: "You've been successfully logged out." });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

// so far so good => any error to be reported asap.
module.exports = { registerNewUser,activateAdminAccount,activateTenantAccount,activateLandlordAccount,refreshUserAccessToken,signInAdmin,signInTenant,signInLandlord,updatePassword,passwordResetToken,resetPassword,verifyLandlordAccount,logout, googleAuthCallback };
