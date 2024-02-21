const express = require("express");
const Router = express.Router()

const userController = require("../controllers/userController");

Router.get("/login", userController.getLoginPage);
Router.get("/signup", userController.getSignupPage);
Router.post("/signup", userController.signupUser);

module.exports = Router;