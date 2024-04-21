const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const Coupon = require("../models/couponSchema");
const Order = require("../models/orderSchema");
const Category = require("../models/categorySchema")
const Product = require("../models/productSchema")
const moment = require('moment');
const ExcelJS = require("exceljs")
const PDFDocument = require('pdfkit')


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
      res.redirect(`/admin/salesMonthly`)
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
res.render('salesReport', {data: currentOrder, totalPages, currentPage, salesToday: true})
} catch (error) {
  console.log(error.message)
}
}

const salesWeekly = async(req, res) => {
  try {
    let currentDate = new Date()
    const startOfTheWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getVarDate() - currentDate.getDay()
    )
    const endOfTheWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + (6 - currentDate.getDay()),
      23,59,59,999
    )
    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: {
             $gte: startOfTheWeek,
             $lt: endOfTheWeek
          },
          status: "Delivered"
        }
      }
    ]).sort({createdOn: -1})

    
    let itemsPerPage = 5
    let currentPage = parseInt(req.query.page) || 1
    let startIndex = (currentPage - 1) * itemsPerPage
    let endIndex = startIndex + itemsPerPage
    let totalPages = Math.ceil(orders.length / 3)
    const currentOrder = orders.slice(startIndex, endIndex)

    
  } catch (error) {
    console.log(error.message)
  }
}

const salesMonthly = async (req, res) => {
  try {
    console.log("inside slaes monthly");
    let currentMonth = new Date().getMonth() + 1
    const startOfTheMonth = new Date(
      new Date().getFullYear(),
      currentMonth - 1,
      1,
      0,0,0,0
    )
    console.log("current month",currentMonth)
    const endOfTheMonth = new Date(
      new Date().getFullYear(),
      currentMonth,
      0, 23, 59, 59, 999
    )
    console.log("end of the month",endOfTheMonth)
    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: {
            $gte: startOfTheMonth,
            $lt: endOfTheMonth
          },
          status: "Delivered"
        }
      }
      ]).sort({createdOn: -1})
      console.log("orders inside sales Monthly",orders)

      let itemsPerPage = 5
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(orders.length / 3)
      const currentOrder = orders.slice(startIndex, endIndex)

      res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true })
    
  } catch (error) {
    
  }
}
const salesYearly = async (req, res) => {
  try {
      const currentYear = new Date().getFullYear()
      const startofYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)
      const endofYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)

      const orders = await Order.aggregate([
          {
              $match: {
                  createdOn: {
                      $gte: startofYear,
                      $lt: endofYear
                  },
                  status: "Delivered"
              }
          }
      ])


      let itemsPerPage = 5
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(orders.length / 3)
      const currentOrder = orders.slice(startIndex, endIndex)

      res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesYearly: true })

  } catch (error) {
      console.log(error.message);
  }
}



const generatePdf = async (req, res) => {
  try {
      const doc = new PDFDocument();
      const filename = 'sales-report.pdf';
      const orders = req.body;
      // console.log(orders);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      doc.pipe(res);
      doc.fontSize(12);
      doc.text('Sales Report', { align: 'center', fontSize: 16 });
      const margin = 5;
      doc
          .moveTo(margin, margin)
          .lineTo(600 - margin, margin)
          .lineTo(600 - margin, 842 - margin)
          .lineTo(margin, 842 - margin)
          .lineTo(margin, margin)
          .lineTo(600 - margin, margin)
          .lineWidth(3)
          .strokeColor('#000000')
          .stroke();

      doc.moveDown();

      console.log("inside pdfgenerator after doc measurements");

      const headers = ['Order ID', 'Name', 'Date', 'Total'];

let headerX = 20;
const headerY = doc.y + 10;

doc.text(headers[0], headerX, headerY);
headerX += 200;

headers.slice(1).forEach(header => {
  doc.text(header, headerX, headerY);
  headerX += 130;
});

let dataY = headerY + 25;

orders.forEach(order => {
  const cleanedDataId = order.dataId.trim();
  const cleanedName = order.name.trim();

  doc.text(cleanedDataId, 20, dataY, { width: 200 });
  doc.text(cleanedName, 230, dataY);
  doc.text(order.date, 350, dataY, { width: 120 }); 
  doc.text(order.totalAmount, 490, dataY);
  
  dataY += 30;
});

      

      doc.end();
  } catch (error) {
      console.log(error.message);
  }
}

const downloadExcel = async (req, res) => {
  try {

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      worksheet.columns = [
          { header: 'Order ID', key: 'orderId', width: 50 },
          { header: 'Customer', key: 'customer', width: 30 },
          { header: 'Date', key: 'date', width: 30 },
          { header: 'Total', key: 'totalAmount', width: 15 },
          { header: 'Payment', key: 'payment', width: 15 },
      ];

      const orders = req.body;

      orders.forEach(order => {
          worksheet.addRow({
              orderId: order.orderId,
              customer: order.name,
              date: order.date,
              totalAmount: order.totalAmount,
              payment: order.payment,
              products: order.products,
          });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=salesReport.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

  } catch (error) {
      console.log(error.message);
  }
}

const dateWiseFilter = async (req, res) => {
  try {
    console.log(req.query);
    const date = moment(req.query.date).startOf('day').toDate();
    const orders = await Order.aggregate([
      {
        $match: {
            createdOn: {
              $gte: moment(date).startOf('day').toDate(),
              $lt: moment(date).endOf('day').toDate(),
            },
            status: "Delivered"
        }
      }
    ]);
    console.log(orders)
     
    let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true , date})

  } catch (error) {
    console.log(error.message)
  }
}




module.exports = { 
                    getLoginPage, 
                    verifyLogin, 
                    adminDashboard,
                    getCouponPageAdmin,
                    createCoupon,
                    getSalesReportPage,
                    salesToday,
                    salesWeekly,
                    salesMonthly,
                    salesYearly,
                    generatePdf,
                    downloadExcel,
                    dateWiseFilter
                  };
