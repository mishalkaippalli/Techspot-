const User = require("../models/userSchema")
const Category = require("../models/categorySchema");
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")
const address = require("../models/addressSchema")

const getUserProfile = async(req, res)=>{

  try {
    const userId = req.session.user
    console.log("heyo,I am inside getUserProfile. req.session.user is", req.session.user);
    const userData = await User.findById({_id: userId})
    console.log("UserData : ",userData)
    const addressData = await Address.findOne({userId: userId})
    console.log("addressData", addressData);
    const orderData = await Order.find({userId: userId}).sort({createdOn: -1})
    console.log(orderData)
    res.render("profile", {user: userData, userAddress: addressData,order: orderData})
  } catch (error) {
    console.log(error.message)
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

const getAddressAddPage = async (req, res) => {
  try {
    const user = req.session.user
    res.render("add-address", {user: user})
  } catch (error) {
    console.log(error).message
  }
}

const postAddress = async (req, res) => {
  try {
    const session = req.session
    console.log("I am inside post address, session is", session)
    const user = req.session.user
    console.log(user)
    const userData = await User.findOne({_id: user})
    const {
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone,
    } = req.body;
    const userAddress = await Address.findOne({userId: userData._id})
    console.log(userAddress);
    if(!userAddress){
      console.log(userData._id);
      const newAddress = new Address({
        userId: userData._id,
        address:[{
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone,
        }]
      })
      await newAddress.save()
    } else{
      console.log("I am in else, ie user adress exists")
      userAddress.address.push({
        addressType,
        name,
        city,
        landMark,
        state,
        pincode,
        phone,
        altPhone,
      })
      await userAddress.save()
    }
    res.redirect("/profile")
  } catch (error) {
    console.log(error.message)
  }
}

const getEditAddress = async (req, res) =>{
  try {
    const addressId = req.query.id
    const user = req.session.user
    console.log(req.session)
    const currAddress = await Address.findOne({"address._id": addressId})

    const addressData = currAddress.address.find((item) => {
      return item._id.toString() == addressId.toString()    //The code compares the _id of each address object (item._id) with the provided addressId to find the specific address that matches the addressId.
    })
    console.log(addressData);
    res.render("edit-address", {address: addressData, user: user})  
  } catch (error) {
    console.log(error.message)
  }
}

const postEditAddress = async (req, res) => {
  try {
    console.log(req.body)
    const data = req.body
    const addressId = req.query.id
    console.log("heyo iam inside postefitaddress , addressId", addressId)
    const user = req.session.user
    const findAddress = await Address.findOne({"address._id": addressId}); // for finding id of the document
    const matchedAddress = findAddress.address.find(item => item._id == addressId)  //to find id of the adress in doc
    console.log("matchedAdress", matchedAddress);
    await Address.updateOne(
      {
        "address._id": addressId,
        "_id": findAddress._id
      }, 
      {
        $set: {
          "address.$": {                        //The $ operator acts as a placeholder for the first element that matches the query condition. It allows you to update the specific element in the array without knowing its exact position.
            _id: addressId,
            addressType: data.addressType,
            name: data.name,
            city: data.city,
            landMark: data.landMark,
            state: data.state,
            pincode: data.pincode,
            phone: data.phone,
            altPhone: data.altPhone,
          },
        }
      }
    ).then((result) => {
      res.redirect("/profile")
    })
  } catch (error) {
    console.log(error.message)
  }
}

const getDeleteAddress = async(req, res) => {
  try {
    const addressId = req.query.id
    const findAddress = await Address.findOne({"address._id": addressId})
    await Address.updateOne(
      {"address._id": addressId},
      {
        $pull: {
          address : {
            _id: addressId
          }
        }
      }
    ).then((data) => res.redirect("/profile"))
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
                  getUserProfile,
                  editUserDetails,
                  getAddressAddPage,
                  postAddress,
                  getEditAddress,
                  postEditAddress,
                  getDeleteAddress

                }