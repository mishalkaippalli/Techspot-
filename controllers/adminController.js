const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const Coupon = require("../models/couponSchema");
const Order = require("../models/orderSchema");

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

const getSalesReportPage = async(req, res) => {
  try {
    let filterBy = req.query.day
    if(filterBy){
      res.redirect(`/admin/${req.query.day}`)
    } else {
      res.redirect(`/admin/$salesMonthly`)
    }
  } catch (error) {
    console.log(error.message)
  }
}

const salesToday = async(req, res) =>{
try {
  let today = new Date()
  const startOfTheDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  )

  const endOfTheDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  )

  const orders = await Order.aggregate([
    {
      $match: {
        createdOn: {
          $gte: startOfTheDay,
          $lt: endOfTheDay
        },
        status: "Delivered"
      }
    }
  ]).sort({createdOn: -1})

let itemsPerPage = 5
let currentPage = parseInt(req.query.page) || 1
let startIndex = (currentPage -1) * itemsPerPage
let endIndex = startIndex + itemsPerPage
let totalPages = Math.ceil(orders.length/3)
const currentOrder = orders.slice(startIndex, endIndex)

console.log("current order", currentOrder)
res.render('salesReport', {data: currentOrder, totalPages, currentPage, salesToday: True})
} catch (error) {
  console.log(error.message)
}
}




module.exports = { 
                    getLoginPage, 
                    verifyLogin, 
                    adminDashboard,
                    getCouponPageAdmin,
                    createCoupon
                  };
