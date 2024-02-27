const express = require("express");
const Router = express.Router();

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController")
const Category = require("../models/categorySchema");

//admin actions
Router.get("/login", adminController.getLoginPage);
Router.post("/login", adminController.verifyLogin);
Router.get("/dashboard", adminController.adminDashboard);

//customer managemement
Router.get("/users", customerController.getCustomersInfo);
Router.get("/blockCustomer", customerController.getCustomerBlocked);
Router.get("/unblockCustomer", customerController.getCustomerUnblocked);


// category management
Router.get("/categories", categoryController.getCategoryInfo)
Router.post("/addCategory", categoryController.addCategory)
Router.get("/allCategories", categoryController.getAllCategories)
Router.get("/listcategory", categoryController.getListCategory)
Router.get("/unlistCategory", categoryController.getUnlistCategory)
Router.get("/editCategory", categoryController.getEditCategory)


module.exports = Router