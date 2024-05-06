const mongoose = require('mongoose'); 

var orderSchema = new mongoose.Schema({
    ord:{
        type:String,
        default:function(){
           return Math.floor(100000 + Math.random() * 900000).toString();
        }
     },
     userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    date: {
        type:Date,
        default:Date.now,
        required:true, 
    },
    couponDiscount:{
        type:Number,
        default:0
     },
    totalAmount:{
        type:Number,
        required:true,
    },
    actualTotalAmount:{
        type:Number,
        required:true
     },
     paymentMethod:{
        type:String,
        required:true,
    },
    
    address:{
        type:Array,
        required:true,
    },
    products:[{
        productId:{
           type:mongoose.Types.ObjectId,
           ref:'Product'
        },
        quantity:{
           type:Number,
        },
        salePrice:{
           type:Number,
        },
        total:{
           type:Number,
        },
        productStatus:{
           type:String,
           default:'Pending'
        }
     }],
     address:{
        name:{
           type:String,
           required:true,
        },
        phone:{
           type:Number,
           required:true,
        },
        city:{
           type:String,
           required:true,
        },
        landMark:{
           type:String,
           required:true,
        },
        pincode:{
           type:Number,
           required:true
        },
        state:{
            type: String,
            required: true
        }
     },
     orderStatus:{
        type:String,
        default:'Pending',
     },
    returnOrderStatus:{
        status:{
           type:String,
           default:'Not requested'
        },
        reason:{
            type:String,
            default:'No reason'
         }
        },
        deliveredDate:{
            type: Date,
            default:'',
        }  
});

const Order = mongoose.model('Order', orderSchema)
module.exports = Order