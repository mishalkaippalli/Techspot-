const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var couponSchema = new mongoose.Schema({
    couponCode:{
        type:String,
        required:true,
     },
     couponDescription:{
        type:String,
        required:true,
     },
     discountPercentage:{
        type:Number,
        required:true,
     },
     minOrderAmount:{
        type:Number,
        required:true,
     },
     maxDiscountAmount:{
        type:Number,
        required:true,
     },
     validFor:{
        type:Date,
        required:true,
     },
     createdOn:{
        type:Date,
        required:true,
     },
     isActive:{
        type:Boolean,
        default:true,
        required:true,
     }
});

const Coupon = mongoose.model("coupon", couponSchema)
module.exports = Coupon