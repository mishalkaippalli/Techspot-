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


const loadSalesReport = async(req,res)=>{
  try{
     const orders = await Order.aggregate([{$match:{orderStatus:'Delivered'}},{$sort:{date:-1}}]);
    
     res.render('sales-report',{orders});
  }catch(error){
     console.log(error.message);
  }
}


// Sales report filtering

const filterSales = async(req,res)=>{
   try {
    console.log("Iam inside filterSales req.query. is => ",req.query )
      const number = req.query.identify
      // Number is 0 === All orders
      // Number is 1 === Today
      // Number is 2 === Weekly
      // Number is 3 === Monthly
      // Number is 4 === Yearly
      // console.log(number)
 
      const today = new Date();
      if(number === '0'){ // All time report

         // Finding data using aggregate
         const orders = await Order.aggregate([{$match:{orderStatus:'Delivered'}},{$sort:{date:-1}}]);
         res.json({orders});

      }else if (number === '1') { // Daily report

         const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
         const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
         // Finding data using aggregate
         const orders = await Order.aggregate([ 
            {
               $match: {
                  orderStatus: 'Delivered',
                  date: {
                     $gte: startOfDay,
                     $lt: endOfDay
                  }
               }
            },
            {$project:{
               date:1,
               actualTotalAmount:1
            }},
            {$sort:{date:-1}}
         ]);
         
         res.json({ orders });

      }else if(number === '2'){ // Weekly Report

         const currentDay = today.getDay();
         const startofWeek = new Date(today)
         startofWeek.setDate(today.getDate()-currentDay) // We will get the sunday "0"

         const endofWeek = new Date(today)
         endofWeek.setDate(today.getDate() + 6-currentDay); // we will get the saturday it means "6"

         const orders = await Order.aggregate([
            {$match:{
               orderStatus:'Delivered',
               date:{
                  $gte:startofWeek,
                  $lte:endofWeek
               }
            }},
            {$project:{
               date:1,
               actualTotalAmount:1
            }},
            {$sort:{date:-1}}
         ])
         console.log("orders inside weekly report ", orders);
         res.json({orders});

      }else if(number === '3'){ // Monthly Report

         // Finding data using aggregate
         const startofMonth = new Date(today.getFullYear(),today.getMonth(),1);
         const endofMonth = new Date(today.getFullYear(),today.getMonth()+1, 0, 23, 59, 59, 999);
         
         const orders = await Order.aggregate([
          {$match:{
             orderStatus:'Delivered',
             date:{
                $gte:startofMonth,
                $lte:endofMonth
             }
          }},
          {$project:{
             date:1,
             actualTotalAmount:1
          }},
          {$sort:{date:-1}}
       ])
       res.json({orders});

      }else if(number ==='4'){ // Yearly Report

         const startOfYear = new Date(today.getFullYear(), 0, 1); // January is 0
         const endOfYear = new Date(today.getFullYear() + 1, 0, 0, 23, 59, 59, 999); // December 31, last millisecond

         const orders = await Order.aggregate([
            {$match:{
               orderStatus:'Delivered',
               date:{
                  $gte:startOfYear,
                  $lte:endOfYear
               }
            }},
            {$project:{
               date:1,
               actualTotalAmount:1
            }},
            {$sort:{date:-1}}
         ])
         res.json({orders});

      }
      // res.render('sales-report')
   } catch (error) {
      console.log(error.message);
   }
}

const dateWiseSales = async(req,res)=>{
  try {
     let {startingDate , endingDate} = req.body
     // console.log('Started :',startingDate)
     // console.log('End :',endingDate)
     startingDate = new Date(startingDate);
     endingDate = new Date(endingDate);

     const orders = await Order.aggregate([
        {$match:{
           orderStatus:'Delivered',
           date:{
              $gte:startingDate,
              $lte:endingDate
           }
        }},
        {$project:{
           date:1,
           actualTotalAmount:1
        }},
        {$sort:{date:-1}}
     ])
     res.json({orders});
  } catch (error) {
     console.log(error.message);
  }
}
// Generate sales report in pdf
const generateSalesPdf = async (req, res) => {
  try {
      const doc = new PDFDocument(); //fromPdfkit library
      const filename = 'sales-report.pdf';
      const orders = req.body;

      // Set content type to PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      // Pipe the PDF kit to the response
      doc.pipe(res);

      // Add content to the PDF
      doc.fontSize(12);
      doc.text('Sales Report', { align: 'center',fontSize: 16 });
      const margin = 10; // 1 inch margin

      doc.moveTo(margin, margin) // Top-left corner (x, y)
      .lineTo(600 - margin, margin) // Top-right corner (x, y)
      .lineTo(600 - margin, 842 - margin) // Bottom-right corner (x, y)
      .lineTo(margin, 842 - margin) // Bottom-left corner (x, y)
      .lineTo(margin, margin) // Back to top-left to close the rectangle
      .lineTo(600 - margin, margin) // Draw line across the bottom edge
      .lineWidth(3)
      .strokeColor('#000000')
      .stroke();
   
     doc.moveDown();
   

      // Define table headers
      const headers = ['Order ID', 'Date', 'Total'];

      // Calculate position for headers
      let headerX = 20;
      let headerY = doc.y + 10;

      // Draw headers
      headers.forEach(header => {
          doc.text(header, headerX, headerY);
          headerX += 220; // Adjust spacing as needed
      });

      // Calculate position for data
      let dataY = headerY + 25;

      // Draw data
      orders.forEach(order => {
          doc.text(order.orderId, 20, dataY);
          doc.text(order.date, 240, dataY);
          console.log(order.totalAmount)
          doc.text(`€ ${order.totalAmount}`, 460, dataY);
          dataY += 25; // Adjust spacing as needed
      });

      // Finalize the PDF
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
           { header: 'Date', key: 'date', width: 30 },
           { header: 'Total', key: 'totalAmount', width: 15 },
       ];
 
       const orders = req.body;
 
       orders.forEach(order => {
           worksheet.addRow({
               orderId: order.orderId,
               date: order.date,
               totalAmount: order.totalAmount,
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




module.exports = { 
                    getLoginPage, 
                    verifyLogin, 
                    adminDashboard,
                    downloadExcel,
                    loadSalesReport,
                    filterSales,
                    dateWiseSales,
                    generateSalesPdf
                  };
