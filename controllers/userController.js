const bcrypt = require("bcryptjs");
const User = require("../models/userSchema");

const getLoginPage = async (req, res) => {
    try {
        res.render("login")
        // if(!req.session.user){
        //     res.render("login")
        // } else {
        //     res.redirect("/")
        // }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    getLoginPage
}