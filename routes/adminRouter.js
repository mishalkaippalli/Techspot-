const express = require("express");
const Router = express.Router();

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const brandController = require("../controllers/brandController");
const orderController = require("../controllers/orderController.js")
const Category = require("../models/categorySchema");

const {isAdmin} = require("../authenticaiton/auth.js")

//admin actions
Router.get("/login", adminController.getLoginPage);
Router.post("/login", adminController.verifyLogin);
Router.get("/dashboard",isAdmin, adminController.adminDashboard);
Router.get("/",isAdmin, adminController.adminDashboard);

//customer managemement
Router.get("/users",isAdmin, customerController.getCustomersInfo);
Router.get("/blockCustomer",isAdmin, customerController.getCustomerBlocked);
Router.get("/unblockCustomer",isAdmin, customerController.getCustomerUnblocked);

//Multer settings
const multer = require("multer");
const storage = require("../associates/multer");
const upload = multer({ storage: storage }); //upload holds multer middleware
Router.use("public/uploads", express.static("public/uploads"));

// category management
Router.get("/categories",isAdmin,  categoryController.getCategoryInfo);
Router.post("/addCategory",isAdmin, categoryController.addCategory);
Router.get("/allCategories",isAdmin, categoryController.getAllCategories);
Router.get("/listcategory",isAdmin, categoryController.getListCategory);
Router.get("/unlistCategory",isAdmin, categoryController.getUnlistCategory);
Router.get("/editCategory",isAdmin, categoryController.getEditCategory);
Router.post("/editCategory/:id",isAdmin, categoryController.editCategory);

// brand management
Router.get("/brands",isAdmin, brandController.getBrandPage);
Router.post("/addBrand",isAdmin, upload.single("image"), brandController.addBrand);
Router.post("/allBrands",isAdmin, brandController.getAllBrands);
Router.get("/blockbrand",isAdmin, brandController.blockBrand);
Router.get("/unblockBrand",isAdmin, brandController.unBlockBrand);

// product management
Router.get("/addProducts",isAdmin, productController.getProductAddPage);
Router.post("/addProducts",isAdmin, upload.array("images", [3]), productController.addProducts);
Router.get("/products",isAdmin, productController.getAllProducts);
Router.get("/editProduct",isAdmin, productController.getEditProduct);
Router.post("/editProduct/:id",isAdmin, upload.array("images", 5), productController.editProduct);
Router.post("/deleteImage",isAdmin, productController.deleteSingleImage)

//Order Management
Router.get("/orderList", isAdmin, orderController.getOrderListPageAdmin)
Router.get("/orderDetailsAdmin", isAdmin, orderController.getOrderDetailsPageAdmin)
Router.get("/changeStatus", isAdmin, orderController.changeOrderStatus)

//Coupon Management
Router.get("/coupon", isAdmin, adminController.getCouponPageAdmin)
Router.post("/createCoupon", isAdmin, adminController.createCoupon)


module.exports = Router;
