const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLenght: [4, "Name should have more than 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email"],
    unique: true,
    validate: [validator.isEmail, "Please enter valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your Password"],
    minLenght: [8, "Password should have more than 8 characters"],
    select: false, //on getting data from mongo we will not recieve this filed
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "user",
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// encrypting password before saving to db
//pre is used for event just saving into database
// function keyword is used as we want to use this keyword
userSchema.pre("save", async function (next) {
  // if password is same i.e. no changes in password field
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10); //second para increases the power of hashing the more power more stronger and slower
});

// JWT TOKEN (power after login)
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
// Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");
  // Hasing and adding resetPasswordToken to userSchema
  // Hash kar ke db pe dale may be koi dekh na le 
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  
  // note sending resetToken Insted to resetPasswordToken
  return resetToken;
};

console.log(this.comparePassword);
module.exports = mongoose.model("User", userSchema);
