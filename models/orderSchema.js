const mongoose = require('mongoose'); 

var orderSchema = new mongoose.Schema({
    product:{
        type:Array,
        required:true,
    },
    couponDiscount:{
        type:Number,
        default:0
     },
    totalPrice:{
        type:Number,
        required:true,
    },
    actualTotalAmount:{
        type:Number,
        required:true
     },
    address:{
        type:Array,
        required:true,
    },
    payment:{
        type:String,
        required:true,
    },
    userId: {
        type : String,
        required : true
    },
    status : {
        type : String,
        required : true
    },
    createdOn:{
      type: Date,
      required: true
    },
    date: {
        type : String 
    }
});

const Order = mongoose.model('Order', orderSchema)
module.exports = Order