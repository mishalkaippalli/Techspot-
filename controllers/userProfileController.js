const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")

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

module.exports = {
                  getUserProfile,
                  editUserDetails,
                  getAddressAddPage
                }