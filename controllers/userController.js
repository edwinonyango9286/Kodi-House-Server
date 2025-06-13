const expressAsyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const _ = require("lodash");
const User = require("../models/userModel");
const sendMail = require("../utils/sendMails");


// get user profile
const me = expressAsyncHandler(async (req, res, next) => {
  try {
    const me = await User.findById({ _id: req.user._id }).populate({ path:"role", select:"name"});
    if (!me) {return res.status(404).json({ status: "FAILED", message: "User not found." });}
    return res.status(200).json({ status: "SUCCESS", data: me });
  } catch (error) {
    next(error);
  }
});


// update user account
const updateUserProfile = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const {firstName,secondName,email,businessName,idNumber,lastName,address,phoneNumber,} = req.body;
      // validate required fields
      if (!firstName || !secondName || !email ||!phoneNumber || !businessName || !idNumber || !address ) {
        return res.status(400).json({status: "FAILED", message: "Please provide all the required fields.",});
      }
      validatePhoneNumber(phoneNumber);
      if (!emailValidator.validate(email)) {
        return res.status(400).json({ status: "SUCCESS",message: "Please provide a valid email address.",});
      }
      const updatedUser = await User.findOneAndUpdate(
        {_id: req.user._id,},
        {...req.body, firstName: _.startCase(_.toLower(firstName)),
          secondName: _.startCase(_.toLower(secondName)),
          lastName: _.startCase(_.toLower(lastName)),
          businessName: _.startCase(_.toLower(businessName)),
        },
        { new: true, runValidators: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ status: "FAILED", message: "User not found." });
      }
       return res.status(200).json({ status: "SUCCESS", message: "Profile updated successfully.",data: updatedUser,
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
);


// list all users by user types
// this function gets all users by passing the userType in the params
const listUsersByUserType =  expressAsyncHandler(async(req,res, next)=>{
  try {
    const {userType} = req.params;
    console.log(userType,"=>userType")
    const validUserTypes = ["Admin","Landlord","Tenant","User"];
    if(!validUserTypes.includes(userType)){
      return res.status(400).json({status:"FAILED", message:"Invalid user type provided."})
    }
    const users = await User.find({"role.name": userType})
    if(users){
    return res.status(200).json({ status:"SUCCESS", message:"Users listed successfully", data:users})
    }
  } catch (error) {
    next(error)
  }
})



// export interface  IAddUserPayload {
//   role:string,
//   firstName:string,
//   lastName:string,
//   email:string,
//   status:string,
//   phoneNumber:string,
//   description:string
// }

const  generateUserPassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specials = '@$!%*?&';
  
  // Ensure we have at least one of each required character type
  const randomLower = lowercase[Math.floor(Math.random() * lowercase.length)];
  const randomUpper = uppercase[Math.floor(Math.random() * uppercase.length)];
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
  const randomSpecial = specials[Math.floor(Math.random() * specials.length)];
  
  // Combine all characters and shuffle
  const allChars = lowercase + uppercase + numbers + specials;
  let password = randomLower + randomUpper + randomNumber + randomSpecial;
  
  // Add random characters to reach minimum length (8)
  for (let i = 4; i < 12; i++) { // Generates passwords between 8-12 chars
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to mix the required characters
  return password.split('').sort(() => Math.random() - 0.5).join('');
}



const createSystemUser  = expressAsyncHandler(async (req, res, next) => {
  try {
    const { role, firstName, lastName, email, status, phoneNumber, description } = req.body;

    if (!role || !firstName || !lastName || !email || !status || !phoneNumber || !description) {
      return res.status(400).json({ status: "FAILED", message: "Please provide all the required fields." });
    }
    if (!emailValidator.validate(email)) {
      return res.status(400).json({ status: "FAILED", message: "Please provide a valid email address." });
    }

    // Check if the user already exists
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(409).json({ status: "FAILED", message: `User  with email ${existingUser.email} already exists.` });
    }

    const userPassword = generateUserPassword();

    const createdUser  = await User.create({...req.body, password: userPassword, createdBy:req.user._id, firstName: _.startCase(firstName) , lastName:_.startCase(lastName)});
    const data = {user: {userName: `${firstName} ${lastName}`, email: createdUser.email,}, password: userPassword,};
    await sendMail({ email: createdUser.email, subject: "User account creation", template: "system-user-account-creation.ejs", data,});

    return res.status(201).json({status: "SUCCESS", message: "User  has been successfully created. The password has been sent to the registered email address.",});
  } catch (error) {
    logger.error(error);
    next(error);
  }
});


// lists all system users
const listSystemUsers =  expressAsyncHandler( async(req,res,next)=>{
  try {
    const allUser = await User.find({ isDeleted:false, deletedAt:null}).populate("role", "name").populate("createdBy", "userName")
    const systemUser = allUser.filter((user)=>user.role && ["Editor","Author"].includes(user.role.name)).reverse()
    if(systemUser){
      return res.status(200).json({ status:"SUCCESS", message:"Users listed successfully.", data:systemUser})
    }
  } catch (error) {
    next(error)
  }
})



module.exports = {me,updateUserProfile, listUsersByUserType , createSystemUser, listSystemUsers };
