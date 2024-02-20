const express = require("express");
const Router = express.Router()

const userController = require("../controllers/userController");

Router.get("/login", userController.getLoginPage);

module.exports = Router;