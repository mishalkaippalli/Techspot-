const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");

// Declare the Schema of the Mongo model
var userSchema = new Mongoose.Schema({
  firstName :{
    type:String,
    required:true,
 },
 lastName:{
    type:String,
    required:true,
 },
 email:{
    type:String,
    required:true,
 },
 password:{
    type:String,
    required:true
 },
 mobile:{
    type:Number,
    required:true,
 },
 is_admin:{
    type:Boolean,
    default:false,
 },
 is_blocked:{
    type:Boolean,
    default:false
 }
});

const User = Mongoose.model("User", userSchema);

module.exports = User;
