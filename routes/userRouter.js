const express = require("express");
const Router = express.Router();

const userController = require("../controllers/userController");
const userProfileController = require("../controllers/userProfileController")
const cartController = require("../controllers/cartController")
const { isLogged } = require("../authenticaiton/auth");

//User Actions
Router.get("/", userController.getHomePage);
Router.get("/login", userController.getLoginPage);
Router.post("/login", userController.userLogin);
Router.get("/signup", userController.getSignupPage);
Router.post("/signup", userController.signupUser);
Router.post("/resendOtp", userController.resendOtp);
Router.post("/verify-otp", userController.verifyOtp);
Router.get("/logout", userController.getLogoutUser)

//Product based routes
Router.get("/shop", isLogged, userController.getShopPage);
Router.get("/productDetails", userController.getProductDetailPage);

// user Profile
Router.get("/profile", isLogged, userProfileController.getUserProfile );
Router.post("/editUserDetails", isLogged, userProfileController.editUserDetails)
Router.get("/addAddress", isLogged, userProfileController.getAddressAddPage )
Router.post("/addAddress", isLogged, userProfileController.postAddress )
Router.get("/editAddress", isLogged, userProfileController.getEditAddress)
Router.post("/editAddress", isLogged, userProfileController.postEditAddress)
Router.get("/deleteAddress", isLogged, userProfileController.getDeleteAddress)

//cart management
Router.get("/cart", isLogged, cartController.getCartPage)
Router.post("/addToCart", isLogged, cartController.addToCart)


module.exports = Router;
