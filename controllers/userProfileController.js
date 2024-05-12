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

// const getUserProfile = async(req, res)=>{

//   try {
//     const userId = req.session.user
//     console.log("heyo,I am inside getUserProfile. req.session.user is", req.session.user);
//     const userData = await User.findById({_id: userId})
//     console.log("UserData : ",userData)
//     const addressData = await Address.findOne({userId: userId})
//     console.log("addressData", addressData);
//     const orderData = await Order.find({userId: userId}).sort({createdOn: -1})
//     console.log(orderData)
//     res.render("profile", {user: userData, userAddress: addressData,order: orderData})
//   } catch (error) {
//     console.log(error.message)
//   }
// }

// User Profile
const userProfile = async(req,res)=>{
  try {
     const user_id = req.session.user;
     // console.log(user_id);
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

// const editProfile = async(req,res)=>{
//   try {
//      const {firstName,lastName,email,mobile,userId} = req.body;
//      const usersData = await User.find();

//     // Find other Users and find is the email already exist or not

//      const anotherUser = usersData.filter(user=>user._id.toString() !== userId);
//      const emailExists = anotherUser.filter(user=>user.email === email);
//      const mobileExist = anotherUser.filter(user=>user.mobile.toString() === mobile);
     
//      if(emailExists.length && mobileExist.length){
//         res.json({status:'error',message:'Email and Mobile Number Already Exists'});
//      }else if(emailExists.length){
//         res.json({status:'error',message:'Email Already Exists'});
//      }else if(mobileExist.length){
//         res.json({status:'error',message:'Mobile Number Already Exists'});
//      }else{
//         const user = await User.findByIdAndUpdate(userId,
//            {$set:{
//               firstName:firstName,
//               lastName:lastName,
//               email:email,
//               mobile:mobile
//            }},
//            {new:true});
//         res.json({status:'success',message:'Profile Edited'});
//      }
//   } catch (error) {
//      console.log(error.message);
//      res.json({status:'error',message:'Something went Wrong'});
//   }
// }

// Edit user profile 

const editProfile = async(req,res)=>{
   try {
      const {firstName,email,mobile,userId} = req.body;
      const usersData = await User.find();

     // Find other Users and find is the email already exist or not

      const anotherUser = usersData.filter(user=>user._id.toString() !== userId);
      const emailExists = anotherUser.filter(user=>user.email === email);
      const mobileExist = anotherUser.filter(user=>user.phone.toString() === mobile);
      
      if(emailExists.length && mobileExist.length){
         res.json({status:'error',message:'Email and Mobile Number Already Exists'});
      }else if(emailExists.length){
         res.json({status:'error',message:'Email Already Exists'});
      }else if(mobileExist.length){
         res.json({status:'error',message:'Mobile Number Already Exists'});
      }else{
         const user = await User.findByIdAndUpdate(userId,
            {$set:{
               name:firstName,
               email:email,
               phone:mobile
            }},
            {new:true});
            console.log("user updated data is", user)
         res.json({status:'success',message:'Profile Edited'});
      }
   } catch (error) {
      console.log(error.message);
      res.json({status:'error',message:'Something went Wrong'});
   }
}

// ===============================ADDRESS=========================

// const getAddressAddPage = async (req, res) => {
//   try {
//     const user = req.session.user
//     res.render("add-address", {user: user})
//   } catch (error) {
//     console.log(error).message
//   }
// }

//load manage address
const loadManageAddress = async(req,res)=>{
  try {
     const user_id = req.session.user;
     let userAddress = await Address.findOne({userId:user_id});

     if(!userAddress){
        userAddress = new Address({userId:user_id,address:[]});
        await userAddress.save();
     }
     // console.log(userAddress)
     const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
     res.render('manage-address',{address:userAddress.address,cartItemsCount});
  } catch (error) {
     console.log(error.message);
  }
}


// const postAddress = async (req, res) => {
//   try {
//     const session = req.session
//     console.log("I am inside post address, session is", session)
//     const user = req.session.user
//     console.log(user)
//     const userData = await User.findOne({_id: user})
//     const {
//             addressType,
//             name,
//             city,
//             landMark,
//             state,
//             pincode,
//             phone,
//             altPhone,
//     } = req.body;
//     const userAddress = await Address.findOne({userId: userData._id})
//     console.log(userAddress);
//     if(!userAddress){
//       console.log(userData._id);
//       const newAddress = new Address({
//         userId: userData._id,
//         address:[{
//             addressType,
//             name,
//             city,
//             landMark,
//             state,
//             pincode,
//             phone,
//             altPhone,
//         }]
//       })
//       await newAddress.save()
//     } else{
//       console.log("I am in else, ie user adress exists")
//       userAddress.address.push({
//         addressType,
//         name,
//         city,
//         landMark,
//         state,
//         pincode,
//         phone,
//         altPhone,
//       })
//       await userAddress.save()
//     }
//     res.redirect("/profile")
//   } catch (error) {
//     console.log(error.message)
//   }
// }

//Adding Address
const addingAddress = async(req,res)=>{
  try {
     const {name,mobile,homeAddress,city,state,postalCode} = req.body;
     // console.log(name)
     // console.log(mobile)
     // console.log(homeAddress)
     // console.log(city)
     // console.log(state)
     // console.log(postalCode)

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
     console.log("inside adding address, added address data is",userAddress);
     res.json({status:'success'});
  } catch (error) {
     console.log(error.message);
     res.json({status:'error'});
  }
}


// const getEditAddress = async (req, res) =>{
//   try {
//     const addressId = req.query.id
//     const user = req.session.user
//     console.log(req.session)
//     const currAddress = await Address.findOne({"address._id": addressId})

//     const addressData = currAddress.address.find((item) => {
//       return item._id.toString() == addressId.toString()    //The code compares the _id of each address object (item._id) with the provided addressId to find the specific address that matches the addressId.
//     })
//     console.log(addressData);
//     res.render("edit-address", {address: addressData, user: user})  
//   } catch (error) {
//     console.log(error.message)
//   }
// }

//Load the Edit User address page
const loadEditAddress = async(req,res)=>{
  try{
     const user_id = req.session.user;
     const addressId = req.query.addressId;
     const user = await Address.findOne({userId:user_id});
     // console.log(userAddress)
     
     const userAddress = user.address.find((address)=>{
        return address._id.toString() === addressId;
     })

     // console.log(userAddress);
     const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
     res.render('edit-address',{userAddress, cartItemsCount});
  }catch(error){
     console.log(error.message);
  }
}

// const postEditAddress = async (req, res) => {
//   try {
//     console.log(req.body)
//     const data = req.body
//     const addressId = req.query.id
//     console.log("heyo iam inside postefitaddress , addressId", addressId)
//     const user = req.session.user
//     const findAddress = await Address.findOne({"address._id": addressId}); // for finding id of the document
//     const matchedAddress = findAddress.address.find(item => item._id == addressId)  //to find id of the adress in doc
//     console.log("matchedAdress", matchedAddress);
//     await Address.updateOne(
//       {
//         "address._id": addressId,
//         "_id": findAddress._id
//       }, 
//       {
//         $set: {
//           "address.$": {                        //The $ operator acts as a placeholder for the first element that matches the query condition. It allows you to update the specific element in the array without knowing its exact position.
//             _id: addressId,
//             addressType: data.addressType,
//             name: data.name,
//             city: data.city,
//             landMark: data.landMark,
//             state: data.state,
//             pincode: data.pincode,
//             phone: data.phone,
//             altPhone: data.altPhone,
//           },
//         }
//       }
//     ).then((result) => {
//       res.redirect("/profile")
//     })
//   } catch (error) {
//     console.log(error.message)
//   }
// }

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
      
      // console.log(updatedAddress)
      res.json({status:'success',message:'Address Edited'});
   } catch (error) {
      res.json({status:'error',message:'Something went wrong'});
      console.log(error.message);
   }
}

// const getDeleteAddress = async(req, res) => {
//   try {
//     const addressId = req.query.id
//     const findAddress = await Address.findOne({"address._id": addressId})
//     await Address.updateOne(
//       {"address._id": addressId},
//       {
//         $pull: {
//           address : {
//             _id: addressId
//           }
//         }
//       }
//     ).then((data) => res.redirect("/profile"))
//   } catch (error) {
//     console.log(error.message)
//   }
// }

// Delete the user address 
const deleteAddress = async(req,res)=>{
   try {
      const user_id = req.session.user;
      const addressId = req.query.addressId;
      // console.log(req.query.addressId);
      const address = await Address.findOne({userId:user_id});

      const deletedAddress = address.address.find(address=>address._id.toString() === addressId);
      // console.log(deletedAddress);

      const isDefaultedAddress = deletedAddress.isDefault;
      // console.log(isDefaultedAddress);

      // Remove the address
      address.address = address.address.filter((addr)=>addr._id.toString() !== addressId);
      // console.log(address.address);
      console.log(address.address.length)
      if(isDefaultedAddress && address.address.length > 0){
         let newDefaultAddress = address.address.find(addr=>addr._id.toString() !== addressId);
         if(newDefaultAddress){
            newDefaultAddress.isDefault = true;
         }
         // console.log(newDefaultAddress)
      }
      // console.log(address);
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
                  loadManageAddress,
                  addingAddress,
                  loadEditAddress,
                  editAddress,
                  deleteAddress
                }