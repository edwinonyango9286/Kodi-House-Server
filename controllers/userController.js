const expressAsyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const validatePhoneNumber = require("../utils/validatePhoneNumber");
const emailValidator = require("email-validator");
const _ = require("lodash");
const User = require("../models/userModel");
const sendMail = require("../utils/sendMails");
const { generateUserPassword } = require("../utils/generateUserPassword");
const Role = require("../models/roleModel")


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
      const {firstName,secondName,email,idNumber, lastName, address,phoneNumber, businessName} = req.body;
      // validate required fields
      if (!firstName || !secondName || !email || !phoneNumber  || !idNumber || !address ) {
        return res.status(400).json({status: "FAILED", message: "Please provide all the required fields......",});
      }
      validatePhoneNumber(phoneNumber);
      if (!emailValidator.validate(email)) {
        return res.status(400).json({ status: "SUCCESS",message: "Please provide a valid email address.",});
      }

      const updatedUser = await User.findOneAndUpdate({_id: req.user._id,}, {...req.body, firstName: _.startCase(_.toLower(firstName)), secondName: _.startCase(_.toLower(secondName)), lastName: _.startCase(_.toLower(lastName)), businessName: _.startCase(_.toLower(businessName))},{ new: true, runValidators: true });
      if (!updatedUser) {
        return res.status(404).json({ status: "FAILED", message: "User not found." });
      }
       return res.status(200).json({ status: "SUCCESS", message: "Profile updated successfully.",data: updatedUser });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
);


const listUsers = expressAsyncHandler(async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "offset", "fields","search"];
    excludeFields.forEach((el) => delete queryObject[el]);
    
    const roleFilter = { }
    const userGroupRole =  await Role.findOne({ name: _.startCase(_.toLower(req.query.role))});
    console.log(userGroupRole.name,"=>userRole")

    if(userGroupRole){
      roleFilter.role = userGroupRole._id
      delete queryObject.role
    }

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const userMakingRequest =  await User.findOne({ _id:req.user._id}).populate("role", "name");
    console.log(userMakingRequest.role.name,"=>userMakingRequest");

     let query;
     const baseQuery = JSON.parse(queryStr);

     if(req.query.search) {
      const searchRegex = new RegExp(req.query.search,"i");
      baseQuery.$or =[{userName:searchRegex},{firstName:searchRegex}, {lastName:searchRegex}, {secondName:searchRegex},{email:searchRegex}, {phoneNumber:searchRegex},{status:searchRegex}]
     }

     if( userMakingRequest && userMakingRequest.role.name ==="Landlord"){
      query = User.find({...baseQuery, ...roleFilter, isDeleted: false, deletedAt: null, createdBy:req.user._id}).populate("role","name").populate("properties", "name").populate("units", "name")
     } else {
      query = User.find({...baseQuery, ...roleFilter, isDeleted: false, deletedAt: null,}).populate("role","name").populate("properties","name").populate("units","unitNumber")
     }
     
    if (req.query.sort) query = query.sort(req.query.sort.split(",").join(" "));
    if (req.query.fields) query = query.select(req.query.fields.split(",").join(" "));
    
    const limit = parseInt(req.query.limit) || 10;
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0) 
    query = query.skip(offset).limit(limit);

    
    const users = await query
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount/limit)

  
   return res.status(200).json({status: "SUCCESS", message:"Users listed successfully.", data: users, totalCount,totalPages,limit, offset });
  } catch (error) {
    next(error);
  }
});

// list landlord users

const listLandlordUsers =  expressAsyncHandler(async (req,res,next)=>{
  try {

    const roleFilter = {};
    const userGroupRole = await Role.findOne();

    const landlordUsers =  await User.find({ createdBy:req.user._id, isDeleted:false,deletedAt:null });
    return res.status(200).json({ status:"SUCCESS", message:"Users listed successfully.", data:landlordUsers})
  } catch (error) {
    logger.error(error)
    next(error)
  }
  
})



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
    await sendMail({ email: createdUser.email, subject: "User account creation", template: "user-account-creation.ejs", data,});

    return res.status(201).json({status: "SUCCESS", message: "User  has been successfully created. User password has been sent to the registered email address.",});
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


module.exports = {me,updateUserProfile, listUsers, createSystemUser, listSystemUsers , listLandlordUsers};
