const express = require("express");
const Router = express.Router()

const userController = require("../controllers/userController");

Router.get("/", userController.getHomePage);
Router.get("/login", userController.getLoginPage);
Router.post("/login", userController.userLogin);
Router.get("/signup", userController.getSignupPage);
Router.post("/signup", userController.signupUser);
Router.post("/resendOtp", userController.resendOtp);
Router.post("/verify-otp", userController.verifyOtp);
Router.get("/productdetails", userController.getProductDetailsPage)

//shop
Router.get("/shop", userController.getShopPage);

module.exports = Router;