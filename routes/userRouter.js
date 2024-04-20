const express = require("express");
const Router = express.Router();

const userController = require("../controllers/userController");
const userProfileController = require("../controllers/userProfileController")
const cartController = require("../controllers/cartController")
const { isLogged, isAdmin } = require("../authenticaiton/auth");
const orderController = require("../controllers/orderController")

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
Router.get("/search", userController.searchProducts)
Router.get("/filter", userController.filterProduct)
Router.get("/filterPrice", userController.filterByPrice)
Router.post("/sortProducts", userController.getSortProducts)

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
Router.post("/changeQuantity", isLogged, cartController.changeQuantity)
Router.get("/deleteItem", isLogged, cartController.deleteProduct)

//orders
Router.get("/checkout", isLogged, orderController.getCheckoutPage)
Router.post("/orderPlaced", isLogged, orderController.orderPlaced)
Router.get("/orderDetails", isLogged, orderController.getOrderDetailsPage)
Router.get("/cancelOrder", isLogged, orderController.cancelOrder)
Router.post("/applyCoupon", isLogged, userController.applyCoupon)

//Sales Report
Router.get("/salesReport", isAdmin, adminController.getSalesReportPage)


module.exports = Router;
