const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail=require("../utils/sendEmail")
const crypto=require("crypto")
// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "sample id",
      url: "sample url",
    },
  });
  // token (A special power after login)
  sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  sendToken(user, 200, res);
});

// logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    sucess: true,
    message: "logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get resetPassword Token
  const resetToken = user.getResetPasswordToken();

  // saving reset token in db
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message=`Your Password reset token is : \n\n ${resetPasswordUrl}\n\n
  If you have not requested this email then please ignore it`;

  try{
    await sendEmail({
        email:user.email,
        subject:`${process.env.app_name} Password Recovery`,
        message,
    });
    res.status(200).json({
      sucess:true,
      message:`Email sent to ${user.email} successfully`
    })

  } catch(error){
    // if error remove token and save in db
    user.resetPasswordExpire=undefined;
    user.resetPasswordToken=undefined;
    await user.save({validateBeforeSave:false});
    return next(new ErrorHandler(error.message,500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  
  // req.params.token have the token that is hased and later searched in db
  const resetPasswordToken = crypto
  .createHash("sha256")
  .update(req.params.token)
  .digest("hex");
  
  const user=await User.findOne({
    resetPasswordToken,
    resetPasswordExpire:{$gt:Date.now()}
  });

  if(!user){
    return next(new ErrorHandler("Reset Password Token is invalid or has been expired",400));
  }
  
  if(req.body.password!=req.body.confirmPassword){
    return next(new ErrorHandler("Password does not match",400));
  }

  user.password=req.body.password;
  user.resetPasswordExpire=undefined;
  user.resetPasswordToken=undefined;
  // save in db
  await user.save();
  // login
  sendToken(user,200,res);
})



// Get User Detail --only when login(may not be admin)
exports.getUserDetails=catchAsyncErrors(async(req,res,next)=>{

   const user=await User.findById(req.user.id);

   res.status(200).json({
    sucess:true,
    user,
   })
})

// Update User Password  --only when login(may not be admin)
exports.updatePassword=catchAsyncErrors(async(req,res,next)=>{

  const user=await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }
  
  if(req.body.newPassword!==req.body.confirmPassword){
    return next(new ErrorHandler("Password does not match", 400));
  }
  
  user.password=req.body.newPassword;
  await user.save();

  sendToken(user,200,res);
})

// Update User Profile  --only when login(may not be admin)
exports.updateProfile=catchAsyncErrors(async(req,res,next)=>{
  
  const newUserData={
    name:req.body.name,
    email:req.body.email,
  }

  const user=await User.findByIdAndUpdate(req.user.id,newUserData,{
    new:true,
    runValidators: true,
    useFindAndModify:false,
  })
  
  res.status(200).json({
    success:true
  })
})

// Get all users --only admin
exports.getAllUsers=catchAsyncErrors(async(req,res,next)=>{
  const users=await User.find();

  res.status(200).json({
    success: true,
    users,
  })
})

// Get single user --only admin
exports.getSingleUser=catchAsyncErrors(async(req,res,next)=>{
  const user=await User.findById(req.params.id);
  
  if(!user){
    return next(new ErrorHandler(`User does not exist with ID:${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    user,
  })
})

// update User Role --admin
exports.updateUserRole=catchAsyncErrors(async(req,res,next)=>{
  
  const newUserData={
    name:req.body.name,
    email:req.body.email,
    role:req.body.role
  }

  const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
    new:true,
    runValidators: true,
    useFindAndModify:false,
  })
  
  res.status(200).json({
    success:true
  })
})

// Delete User --admin
exports.deleteUser=catchAsyncErrors(async(req,res,next)=>{
  
  const user= await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`User does not exits with Id : ${req.params.id}`));
  }

  await user.remove();
  res.status(200).json({
    success:true
  })
})
