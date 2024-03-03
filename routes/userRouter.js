const express = require("express");
const Router = express.Router();

const userController = require("../controllers/userController");
const { isLogged } = require("../authenticaiton/auth");

Router.get("/", userController.getHomePage);
Router.get("/login", userController.getLoginPage);
Router.get("/loginn")
Router.post("/login", userController.userLogin);
Router.get("/signup", userController.getSignupPage);
Router.post("/signup", userController.signupUser);
Router.post("/resendOtp", userController.resendOtp);
Router.post("/verify-otp", userController.verifyOtp);
Router.get("/productdetails", userController.getProductDetailsPage);
Router.get("/logout", userController.getLogoutUser)

//shop
Router.get("/shop", isLogged, userController.getShopPage);



module.exports = Router;
