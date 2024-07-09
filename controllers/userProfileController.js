const User = require("../models/userSchema")
const Category = require("../models/categorySchema");
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")
const address = require("../models/addressSchema")
const Wallet = require('../models/walletSchema');
const mongodb = require("mongodb")
const CartCountHelper = require('../associates/cartItemsCount');
const pass = require("../associates/securePass")



// User Profile
const userProfile = async(req,res)=>{
  try {
     const user_id = req.session.user._id;
     console.log(user_id);
     const userData = await User.findById(user_id);
     console.log("inside controller userprofile", userData)
     const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
     res.render('user-profile',{userData,cartItemsCount});
  } catch (error) {
     console.log(error.message);
  }
}

const editUserDetails = async (req, res) => {
  try {
    const userId = req.query.id
    const data = req.body
    console.log("Iam inside editUerDetails", data)
    await User.updateOne({_id: userId},{$set: {  name: data.name, phone: data.phone}})
    .then((data) => console.log(data))
    res.redirect("/profile")
  } catch (error) {
    console.log(error.message)
  }
}

// Change user password

const changePassword = async(req,res)=>{
   try {
       const {currentPassword , newPassword} = req.body
       console.log('User current password :',currentPassword);
       console.log('User new Password',newPassword);

       const user_id = req.session.user._id;
       const user = await User.findById(user_id)
      
       const isMatch = await pass.checkPassword(currentPassword,user.password);
       if(isMatch){
         const hashedPass = await pass.securePassword(newPassword);
         user.password = hashedPass;
         await user.save();
         res.json({status:'success',message:'Password changed'});
       }else{
         res.json({status:'error',message:'Current Password is Incorrect'});
       }
   } catch (error) {
      console.log(error.message);
   }
}

// Edit user profile 

const editProfile = async(req,res)=>{
   try {
      console.log("inside edit profie")
      const {firstName,lastName,email,mobile,userId} = req.body;
      console.log(req.body)
      const usersData = await User.find();
      console.log("edit profile user data is", usersData)

     // Find other Users and find is the email already exist or not

      const anotherUser = usersData.filter(user=>user._id.toString() !== userId);
      const emailExists = anotherUser.filter(user=>user.email === email);
      const mobileExist = anotherUser.filter(user=>user.mobile === mobile);
      
      if(emailExists.length && mobileExist.length){
         res.json({status:'error',message:'Email and Mobile Number Already Exists'});
      }else if(emailExists.length){
         res.json({status:'error',message:'Email Already Exists'});
      }else if(mobileExist.length){
         res.json({status:'error',message:'Mobile Number Already Exists'});
      }else{
         const user = await User.findByIdAndUpdate(userId,
            {$set:{
               firstName:firstName,
               lastName:lastName,
               email:email,
               mobile:mobile
            }},
            {new:true});
         res.json({status:'success',message:'Profile Edited'});
      }
   } catch (error) {
      console.log(error.message);
      res.json({status:'error',message:'Something went Wrong'});
   }
}

// ===============================ADDRESS=========================


//load manage address
const loadManageAddress = async(req,res)=>{
  try {
   const user_id = req.session.user._id;
     console.log(user_id);
     const userData = await User.findById(user_id);
     let userAddress = await Address.findOne({userId:user_id});

     if(!userAddress){
        userAddress = new Address({userId:user_id,address:[]});
        await userAddress.save();
     }
     // console.log(userAddress)
     const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
     res.render('manage-address',{address:userAddress.address,cartItemsCount,userData});
  } catch (error) {
     console.log(error.message);
  }
}

//Adding Address
const addingAddress = async(req,res)=>{
  try {
     const {name,mobile,homeAddress,city,state,postalCode} = req.body;

     let newAddress ={
        name:name,
        mobile:mobile,
        homeAddress:homeAddress,
        city:city,
        state:state,
        postalCode:postalCode,
        isDefault:false,
     }
     const user_id  = req.session.user
     let userAddress = await Address.findOne({userId:user_id});

     if(!userAddress){
        newAddress.isDefault = true;
        userAddress = new Address({userId:user_id,address:[newAddress]});
     }else{
        userAddress.address.push(newAddress);

        if(userAddress.address.length === 1){
           userAddress.address[0].isDefault = true;
        }
     }
      
     await userAddress.save();
     res.json({status:'success'});
  } catch (error) {
     console.log(error.message);
     res.json({status:'error'});
  }
}

//Load the Edit User address page
const loadEditAddress = async(req,res)=>{
  try{
     const user_id = req.session.user;
     const addressId = req.query.addressId;
     const user = await Address.findOne({userId:user_id});
     
     const userAddress = user.address.find((address)=>{
        return address._id.toString() === addressId;
     })

     const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
     res.render('edit-address',{userAddress, cartItemsCount});
  }catch(error){
     console.log(error.message);
  }
}

// Edit address

const editAddress = async(req,res)=>{
   try {
      const {name,mobile,homeAddress,city,state,postalCode,addressId} = req.body
      
      const user_id = req.session.user;
      const updatedAddress = await Address.findOneAndUpdate({userId:user_id,'address._id':addressId},
      {$set:{
         'address.$.name':name,
         'address.$.mobile':mobile,
         'address.$.homeAddress':homeAddress,
         'address.$.city':city,
         'address.$.state':state,
         'address.$.postalCode':postalCode,
      }},
      {new:true});
      res.json({status:'success',message:'Address Edited'});
   } catch (error) {
      res.json({status:'error',message:'Something went wrong'});
      console.log(error.message);
   }
}

// Delete the user address 
const deleteAddress = async(req,res)=>{
   try {
      const user_id = req.session.user;
      const addressId = req.query.addressId;
      const address = await Address.findOne({userId:user_id});
      const deletedAddress = address.address.find(address=>address._id.toString() === addressId);
      const isDefaultedAddress = deletedAddress.isDefault;

      // Remove the address
      address.address = address.address.filter((addr)=>addr._id.toString() !== addressId);
      console.log(address.address.length)
      if(isDefaultedAddress && address.address.length > 0){
         let newDefaultAddress = address.address.find(addr=>addr._id.toString() !== addressId);
         if(newDefaultAddress){
            newDefaultAddress.isDefault = true;
         }
      }
      await address.save();
      res.json({status:'success',message:'Address Removed'});
   } catch (error) {
      res.json({status:'success',message:'Something went wrong'});
      console.log(error.message);
   }
}

module.exports = {
                  userProfile,
                  editUserDetails,
                  editProfile,
                  changePassword,
                  loadManageAddress,
                  addingAddress,
                  loadEditAddress,
                  editAddress,
                  deleteAddress
                }