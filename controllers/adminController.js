const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const Coupon = require("../models/couponSchema");

const getLoginPage = async (req, res) => {
  try {
    res.render("admin-login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);

    const findAdmin = await User.findOne({ email, isAdmin: "1" });

    if (findAdmin) {
      const passwordMatch = await bcrypt.compare(password, findAdmin.password);
      if (passwordMatch) {
        req.session.admin = true;
        console.log("Admin logged in");
        res.redirect("dashboard");
      } else {
        console.log("Password is incorrect");
        res.render("admin-login", { message: "password incorrect" });
      }
    } else {
      console.log("You are not an admin");
      res.render("admin-login", { message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const getCouponPageAdmin = async (req, res) => {
  try {
    const findCoupons = await Coupon.find({})
    res.render("coupon", {coupons: findCoupons})
  } catch (error) {
    console.log(error.message)
  }
}

const createCoupon = async(req, res) => {
  try {
       const data = {
             couponName: req.body.couponName,
             startDate: new Date(req.body.startDate + 'T00:00:00'),
             endDate: new Date(req.body.endDate + 'T00:00:00'),
             offerPrice: parseInt(req.body.offerPrice),
             minimumPrice: parseInt(req.body.minimumPrice)  
           };

           const newCoupon = new Coupon({
                  name: data.couponName,
                  createdOn: data.startDate,
                  expireOn: data.endDate,
                  offerPrice: data.offerPrice,
                  minimumPrice: data.minimumPrice
                })

            await newCoupon.save().then(data => console.log(data))
            res.redirect("/admin/coupon")
  } catch (error) {
    console.log(error)
  }
}

module.exports = { 
                    getLoginPage, 
                    verifyLogin, 
                    adminDashboard,
                    getCouponPageAdmin,
                    createCoupon
                  };
