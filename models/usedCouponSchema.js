const mongoose = require('mongoose');

const usedCouponModel = new mongoose.Schema({
   userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
      required:true
   },
   userCoupons:[
      {
         couponId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Coupon',
            required:true
         }
      }
   ]
})

module.exports = mongoose.model('usedCoupon',usedCouponModel);