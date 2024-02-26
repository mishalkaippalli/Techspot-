const express = require("express");
const Router = express.Router();

const adminController = require("../controllers/adminController");

Router.get("/login", adminController.getLoginPage);
Router.post("/login", adminController.verifyLogin);
Router.get("/dashboard", adminController.adminDashboard);


module.exports = Router