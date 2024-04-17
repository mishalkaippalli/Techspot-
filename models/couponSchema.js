const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    createdOn:{
        type:Date,
        required:true,
    },
    expireOn:{
        type:Date,
        required:true,
    },
    offerPrice:{
        type:Number,
        required:true,
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    isList: {
        type: Boolean,
        default: true
    },
    userId: {
        type: Array
    }
});

const Coupon = mongoose.model("coupon", couponSchema)
module.exports = Coupon