const express = require("express");
const Router = express.Router();

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const brandController = require("../controllers/brandController")
const Category = require("../models/categorySchema");

//admin actions
Router.get("/login", adminController.getLoginPage);
Router.post("/login", adminController.verifyLogin);
Router.get("/dashboard", adminController.adminDashboard);

//customer managemement
Router.get("/users", customerController.getCustomersInfo);
Router.get("/blockCustomer", customerController.getCustomerBlocked);
Router.get("/unblockCustomer", customerController.getCustomerUnblocked);

//Multer settings
const multer = require("multer")
const storage = require("../associates/multer")
const upload = multer({storage: storage}) //upload holds multer middleware
Router.use("public/uploads", express.static("public/uploads"))

// category management
Router.get("/categories", categoryController.getCategoryInfo)
Router.post("/addCategory", categoryController.addCategory)
Router.get("/allCategories", categoryController.getAllCategories)
Router.get("/listcategory", categoryController.getListCategory)
Router.get("/unlistCategory", categoryController.getUnlistCategory)
Router.get("/editCategory", categoryController.getEditCategory)
Router.post("/editCategory/:id", categoryController.editCategory)

// brand management
Router.get("/brands", brandController.getBrandPage)
Router.post("/addBrand", upload.single('image') , brandController.addBrand)
Router.post("/allBrands", brandController.getAllBrands)
Router.get("/blockbrand", brandController.blockBrand)
Router.get("/unblockBrand", brandController.unBlockBrand)


// product management
Router.get("/addProducts",  productController.getProductAddPage)
Router.post("/addProducts", upload.array('images', [3]), productController.addProducts)
Router.get("/products",  productController.getProductAddPage)




module.exports = Router