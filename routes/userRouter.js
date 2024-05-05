const express = require("express");
const Router = express.Router();

const userController = require("../controllers/userController");
const userProfileController = require("../controllers/userProfileController")
const cartController = require("../controllers/cartController")
const { isLogged, isAdmin } = require("../authenticaiton/auth");
const orderController = require("../controllers/orderController")
const wishlistController = require("../controllers/wishlistController")
const paypalController = require("../controllers/paypalController")
const couponController = require("../controllers/couponController.js")

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
Router.get("/return", isLogged, orderController.returnOrder)

//coupon
Router.post("/applyCoupon", isLogged, couponController.applyCoupon)

// Wishlist
Router.get("/wishlist", isLogged, wishlistController.getWishlistPage)
Router.post("/addToWishlist",isLogged, wishlistController.addToWishlist)
Router.get("/deleteWishlist", isLogged, wishlistController.deleteItemWishlist)

//Onlinepayment
Router.get('/onlinePaymentPage', isLogged, paypalController.paypalpage )
Router.post('/api/orders', isLogged, paypalController.paypalOrderCreator)
Router.post( "/api/orders/:orderID/capture", isLogged, paypalController.paypalCaptureOrder)


module.exports = Router;
