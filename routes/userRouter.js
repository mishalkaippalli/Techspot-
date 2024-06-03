const express = require("express");
const Router = express();
const passport = require('passport')

Router.set("view engine", "ejs");
Router.set("views", "./views/user");

// ===============================Controller importing ==============================

const userController = require("../controllers/userController");
const userProfileController = require("../controllers/userProfileController")
const cartController = require("../controllers/cartController")
const { isLogged, isLogout } = require("../authenticaiton/auth");
const orderController = require("../controllers/orderController")
const wishlistController = require("../controllers/wishlistController")
const paypalController = require("../controllers/paypalController")
const couponController = require("../controllers/couponController.js")
require('../config/passport')

// ===============================User Actions ==============================

Router.get("/", userController.getHomePage);
Router.get("/home", userController.getHomePage);
Router.get("/login", userController.loadLogin);
Router.post("/login", userController.verifyUser);
Router.get("/signup", userController.getSignupPage);
Router.post("/register", userController.insertUser);
Router.post("/resendOtp", userController.resendOtp);
Router.get("/verifyotp", userController.loadVerifiyOTP);
Router.post("/verifyotp", userController.verifyotp);
Router.get("/logout",isLogged, userController.getLogoutUser)

//--------------------------------google sign up ---------------------
Router.get('/googleLog',passport.authenticate('google',{scope:['profile','email']}))
Router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/failed' }),userController.googleAuth)

// ===============================Product based routes ==============================

Router.get("/shop", isLogged, userController.getShopPage);
Router.get("/productDetails", userController.getProductDetailPage);
Router.get("/search", userController.searchProducts)
Router.get("/filter", userController.filterProduct)
Router.get("/filterPrice", userController.filterByPrice)
Router.post("/sortProducts", userController.getSortProducts)

// ===============================user Profile ==============================

// Router.get("/profile", isLogged, userProfileController.getUserProfile );
Router.get('/user-profile', isLogged, userProfileController.userProfile)
Router.post("/editUserDetails", isLogged, userProfileController.editUserDetails)
Router.post("/edit-profile", isLogged,userProfileController.editProfile)
Router.post("/change-password", isLogged, userProfileController.changePassword)
// Router.get("/addAddress", isLogged, userProfileController.getAddressAddPage )
// Router.post("/addAddress", isLogged, userProfileController.postAddress )

// Router.get("/editAddress", isLogged, userProfileController.getEditAddress)
// Router.post("/editAddress", isLogged, userProfileController.postEditAddress)
// Router.get("/deleteAddress", isLogged, userProfileController.getDeleteAddress)

// ===============================Address management ==============================
Router.get('/manage-address',isLogged,userProfileController.loadManageAddress);
Router.post('/add-address',isLogged, userProfileController.addingAddress)
Router.get('/edit-address',isLogged, userProfileController.loadEditAddress);
Router.post('/edit-address', isLogged, userProfileController.editAddress)
Router.get('/delete-address', isLogged, userProfileController.deleteAddress)


// ===============================cart management ==============================

Router.get("/cart", isLogged, cartController.getCartPage)
Router.get("/addToCart", isLogged, cartController.addToCart)
Router.post("/update-quantity", isLogged, cartController.updateQuantity)
Router.get("/deleteItem", isLogged, cartController.deleteProduct)
Router.get('/remove-from-cart', isLogged, cartController.removeFromCart);
Router.get("/checkout", isLogged, cartController.loadCheckOut)

//-----------------------------------------ORDER MANAGEMENT---------------------------


Router.post('/place-order',isLogged, orderController.placeOrder)
Router.post('/verify-payment',isLogged, orderController.verifyOnlinePayment)
Router.get('/confirmation', isLogged, orderController.loadConfirmation )
Router.get('/list-orders',isLogged, orderController.listOrders)
Router.get('/order-details', isLogged, orderController.orderDetails)
Router.get('/cancel-order', isLogged, orderController.cancelOrder)
Router.post('/return-order',isLogged, orderController.returnOrder)
Router.get('/invoice', isLogged, orderController.invoice)

// -----------------------------------COUPON MANAGEMENT---------------------

// Router.post("/applyCoupon", isLogged, couponController.applyCoupon)
Router.get('/apply-coupon',isLogged,couponController.applyCoupons);

// -----------------------------------Wishlist---------------------

Router.get("/wishlist", isLogged, wishlistController.loadWishlist)
Router.post("/addToWishlist",isLogged, wishlistController.addtoWishlist)
Router.get("/remove-from-wishlist", isLogged, wishlistController.removeFromWishlist)

// --------------------------------------WALLET---------------------------

Router.get('/view-wallet',isLogged ,userController.loadWallet);
Router.post('/recharge-wallet', isLogged, userController.rechargeWallet)


// --------------------------------------ONLINE PAYMENT---------------------------

Router.get('/onlinePaymentPage', isLogged, paypalController.paypalpage )
Router.post('/api/orders', isLogged, paypalController.paypalOrderCreator)
Router.post( "/api/orders/:orderID/capture", isLogged, paypalController.paypalCaptureOrder)




module.exports = Router;
