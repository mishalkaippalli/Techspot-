const express = require("express");
const Router = express();

Router.set("view engine", "ejs");
Router.set("views", "./views/admin");

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const brandController = require("../controllers/brandController");
const orderController = require("../controllers/orderController.js")
const Category = require("../models/categorySchema");
const couponController = require("../controllers/couponController.js")

const {isAdmin, isLogged} = require("../authenticaiton/auth.js")

//admin actions
Router.get("/login", adminController.getLoginPage);
Router.post("/login", adminController.verifyLogin);
Router.get("/dashboard",isAdmin, adminController.loadDashboard);
Router.get("/",isAdmin, adminController.loadDashboard);
Router.get("/logout", isAdmin, adminController.getLogout)

//customer managemement
Router.get("/users",isAdmin, customerController.getCustomersInfo);
Router.get("/blockCustomer",isAdmin, customerController.getCustomerBlocked);
Router.get("/unblockCustomer",isAdmin, customerController.getCustomerUnblocked);

//Multer settings
const upload = require("../associates/multer.js") //upload holds multer middleware
Router.use("public/uploads", express.static("public/uploads"));

// category management
Router.get("/categories",isAdmin,  categoryController.getCategoryInfo);
Router.post("/addCategory",isAdmin, categoryController.addCategory);
Router.get("/allCategories",isAdmin, categoryController.getAllCategories);
Router.get("/listcategory",isAdmin, categoryController.getListCategory);
Router.get("/unlistCategory",isAdmin, categoryController.getUnlistCategory);
Router.get("/editCategory",isAdmin, categoryController.getEditCategory);
Router.post("/editCategory/:id",isAdmin, categoryController.editCategory);
Router.post("/addCategoryOffer", isAdmin, categoryController.addCategoryOffer)
Router.post("/removeCategoryOffer", isAdmin, categoryController.removeCategoryOffer)

// brand management
Router.get("/brands",isAdmin, brandController.getBrandPage);
Router.post("/addBrand",isAdmin, upload.single("image"), brandController.addBrand);
Router.post("/allBrands",isAdmin, brandController.getAllBrands);
Router.get("/blockbrand",isAdmin, brandController.blockBrand);
Router.get("/unblockBrand",isAdmin, brandController.unBlockBrand);

// product management
Router.get("/addProducts",isAdmin, productController.getProductAddPage);

Router.post("/addProducts",isAdmin, upload.array("images", [3]),
(req, res) => {
    // Check if req.fileFilterError exists
    if (req.fileFilterError) {
      // Redirect with error message
      return res.redirect("/admin/addProducts?error=" + encodeURIComponent(req.fileFilterError));
    }},
productController.addProducts);

Router.get("/products",isAdmin, productController.getAllProducts);
Router.get("/editProduct",isAdmin, productController.getEditProduct);
Router.post("/editProduct/:id",isAdmin, upload.array("images", 5), productController.editProduct);
Router.post("/deleteImage",isAdmin, productController.deleteSingleImage)
Router.get("/blockProduct", isAdmin, productController.getBlockProduct)
Router.get("/unBlockProduct", isAdmin, productController.getUnblockProduct)
Router.post("/addProductOffer", isAdmin, productController.addProductOffer)
Router.post("/removeProductOffer", isAdmin, productController.removeProductOffer)

// //Order Management
Router.get('/list-orders',isAdmin,orderController.loadOrdersPage)
Router.get("/order-details",isAdmin, orderController.adminOrderDetails)
Router.post("/change-status", isAdmin, orderController.changeStatus)

//Coupon Management

// To load the list of coupons
Router.get("/list-coupons", isAdmin, couponController.listCoupons)

// Load Add the coupons page
Router.get("/add-coupon", isAdmin, couponController.loadAddCoupons)

// Add coupons
Router.post("/add-coupon", isAdmin, couponController.addCoupons)

// Inactivate the coupon
Router.get('/change-coupon-status',isAdmin,couponController.changeCouponStatus);

//sales report
Router.get('/sales-report', isAdmin, adminController.loadSalesReport);
Router.get('/filter-sales',isAdmin, adminController.filterSales)
Router.post('/datewise-filter-sales',isAdmin, adminController.dateWiseSales);
Router.post('/generate-pdf',isAdmin, adminController.generateSalesPdf);
Router.post('/downloadExcel', isAdmin, adminController.downloadExcel)

module.exports = Router;
