const express = require("express");
const Router = express.Router();

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");

//admin actions
Router.get("/login", adminController.getLoginPage);
Router.post("/login", adminController.verifyLogin);
Router.get("/dashboard", adminController.adminDashboard);

//customer managemement
Router.get("/users", customerController.getCustomersInfo);
Router.get("/blockCustomer/:id", customerController.getCustomerBlocked);
Router.get("/unblockCustomer/:id", customerController.getCustomerUnblocked);




module.exports = Router