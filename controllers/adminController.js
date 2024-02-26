const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");

const getLoginPage = async (req, res) => {
    try {
        res.render("admin-login");
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const {email, password} = req.body
        console.log(email);
        
        const findAdmin = await User.findOne({email, isAdmin: "1"})

        if(findAdmin) {
            const passwordMatch = await bcrypt.compare(password, findAdmin.password)
            if (passwordMatch) {
                req.session.admin = true
                console.log("Admin logged in");
                res.redirect("dashboard")
            } else {
                console.log("Password is incorrect");
                res.redirect("/adminDashboard")
            }
        } else {
            console.log("You are not an admin");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async(req, res) => {
    try {
        res.render("dashboard")
    } catch (error) {
        console.log(error.message)
    }
} 


module.exports = 
                { getLoginPage, 
                  verifyLogin,
                  adminDashboard
                }