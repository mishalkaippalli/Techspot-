const Coupon = require("../models/couponSchema");
const UsedCoupon = require('../models/usedCouponSchema'); 

const listCoupons = async (req, res) => {
    try {
      const coupons = await Coupon.find({})
      res.render("list-coupons", {coupons})
    } catch (error) {
      console.log(error.message)
    }
  }

  const loadAddCoupons = async(req, res) => {
     try {
        res.render('add-coupons');
     } catch (error) {
        console.log(error.message)
     }
  }
  
  const addCoupons = async(req, res) => {
    try {
      
           const couponBody = req.body;
           console.log("Iam inside createcoupon in admincontroller the req.body is", req.body)
           // --------Coupon Body ----------------
           const couponCode = couponBody.couponCode;
           const couponDescription = couponBody.couponDescription;
           const discountPercentage = couponBody.couponDiscount;
           const minOrderAmount = couponBody.couponMinAmount;
           const maxDiscountAmount = couponBody.couponMaxDiscountAmount;
           const validFor = couponBody.couponExpiration;
           const createdOn = couponBody.couponCreated;
  
           const couponData = new Coupon({
            couponCode:couponCode,
            couponDescription:couponDescription,
            discountPercentage:discountPercentage,
            minOrderAmount:minOrderAmount,
            maxDiscountAmount:maxDiscountAmount,
            validFor:validFor,
            createdOn:createdOn,
         });
         console.log('Coupon Data is : ',couponData);
         const addedCoupon = await couponData.save();
  
         if(addedCoupon){
            res.json({status:'success',message:'Coupon Added'});
         }
  
    } catch (error) {
      res.json({status:'error', message:'Something went wrong'});
           console.log(error.message)
    }
  }

const changeCouponStatus= async(req, res) => {
  try {
    const couponId = req.query.couponId;
    const updateCouponStatus = await Coupon.findById(couponId);

    if(updateCouponStatus.isActive === true){
        updateCouponStatus.isActive = false;
    }else {
        updateCouponStatus.isActive = true;
    }

    await updateCouponStatus.save();
    res.json({status: 'success', message: 'Status Updated'})
  } catch (error) {
    console.log(error.message)
  }
}

const applyCoupons = async(req,res)=>{
  try {
     const user_id = req.session.user;
     const couponCode = req.query.couponCode.trim();
     const totalAmount = req.query.totalAmount;
     console.log(totalAmount);
     const appliedCoupon = await Coupon.findOne({couponCode:couponCode});
     console.log(appliedCoupon)

     if(!appliedCoupon){
        res.json({status:'error',message:'Invalid Coupon Id'});
     }else{
        let userUsedCoupons = await UsedCoupon.findOne({userId:user_id});

        if(!userUsedCoupons){
           userUsedCoupons = new UsedCoupon({
              userId:user_id,
              userCoupons:[]
           })
           await userUsedCoupons.save();
        }

        if(userUsedCoupons){
           const findCoupon = userUsedCoupons.userCoupons.filter((coupon)=>coupon.couponId.toString()  === appliedCoupon._id.toString() );
           // console.log(findCoupon)
           if(!findCoupon.length){
              const maxAmount = appliedCoupon.maxDiscountAmount;
              let discountValue = parseFloat((appliedCoupon.discountPercentage/100)*totalAmount).toFixed(2);
              let actualValue;
              if(discountValue > maxAmount){
                  actualValue = totalAmount - maxAmount;
                 discountValue = maxAmount
              }else{
                  actualValue = totalAmount - discountValue
              }
              console.log("actualVlaue", actualValue);
              console.log(appliedCoupon._id)
              res.json({status:'success',message:'Coupon Added',discountValue,actualValue,couponId:appliedCoupon._id});
           }else{
              res.json({status:'error',message:"Coupon Already Used"});
           }
        }
     }  
  } catch (error) {
     console.log(error.message);
  }
}


module.exports = {
                   listCoupons,
                   loadAddCoupons,
                   addCoupons,
                   changeCouponStatus,
                   applyCoupons
                  }