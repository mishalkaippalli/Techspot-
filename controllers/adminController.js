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

    const findAdmin = await User.findOne({ email, is_admin: true });

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

// Taking the whole data count
async function oCount() {
   try {
      const orders = await Order.find();

      const count ={
         Delivered:0,
         Placed:0,
         Returned:0,
         Cancelled:0,
         Pending:0,
      }

      orders.forEach((order)=>{
         if(order.orderStatus === 'Delivered'){
            count.Delivered++;
         }else if(order.orderStatus === 'Placed'){
            count.Placed++;
         }else if(order.orderStatus === 'Returned'){
            count.Returned++;
         }else if(order.orderStatus === 'Cancelled'){
            count.Cancelled++;
         }else{
            count.Pending++
         }
      })
      return count;
   } catch (error) {
      console.log(error.message);
   }
}

const loadDashboard = async (req, res) => {

   try {
      const orders = await Order.find();
      // console.log(orders)
      // Finding how many orders we have
      const ordersCount = orders.length;
      const ordCount = await oCount();
      console.log("order count inside the loadDashboard", ordCount);
      
      
      // Finding the total revenue

      const totalRevenue = orders.reduce((acc, order) => {
         return acc += order.products.reduce((acc, product) => {
             if (product.productStatus !== 'Returned') {
                 return acc += product.total;
             }
             return acc;
         }, 0);
     }, 0);
     

      console.log(totalRevenue);

      // Sending the product Details
      const products = await Product.find().populate('category')
      console.log(products)
      const productsCount = products.length;
      let category = new Set(products
         .filter(product => product.category && product.category.name)  // Filter out products without a valid category or category name
         .map(product => product.category.name)  // Map to category names
     )
      console.log(category);

      const categoryCount = Array.from(category).length;
      
      // Find how many items sell in each products========

      function categoryCounter(products){
   
         const categoryCounts = {};
       
         products.forEach((product) => {
             const categoryName = product.category.name;
             if (categoryCounts[categoryName]) {
                 categoryCounts[categoryName]++;
             } else {
                 categoryCounts[categoryName] = 1;
             }
         });
         return categoryCounts
       }
      
       const cCount = categoryCounter(products);
      //  console.log(cCount)
      // console.log('All products :' ,products.length);
      // console.log('All Categories :' ,categoryCount);
      
      const bestSellingProduct = await Order.aggregate([
         {$unwind: "$products"},
         {$group : {
           _id: "$products.productId",
           totalQuantity: {$sum: "$products.quantity"},
         }
        },
        {
         $lookup: {
           from: "products", 
           localField: "_id",
           foreignField: "_id",
           as: "productDetails"
         }
       },
       {
         $unwind: "$productDetails"
       },
       {
         $project: {
           _id: 1,
           totalQuantity: 1,
           "productDetails.productName": 1 // Include other fields as needed
         }
       },
        {$sort: {totalQuantity: -1}},
        {$limit: 10}
      ])
      console.log("bestselling products", bestSellingProduct)

      const bestSellingCategory = await Order.aggregate([
         { $unwind: "$products" },
         {
           $lookup: {
             from: "products", // Assuming there's a collection named "products"
             localField: "products.productId",
             foreignField: "_id",
             as: "productDetails"
           }
         },
         { $unwind: "$productDetails" },
         {
           $lookup: {
             from: "categories", // Assuming there's a collection named "categories"
             localField: "productDetails.category",
             foreignField: "_id",
             as: "categoryDetails"
           }
         },
         { $unwind: "$categoryDetails" },
         {
           $group: {
             _id: "$productDetails.category",
             categoryName: { $first: "$categoryDetails.name" }, // Include category name
             totalQuantity: { $sum: "$products.quantity" }
           }
         },
         { $sort: { totalQuantity: -1 } },
         { $limit: 10 } // Only getting the top-selling category
       ]);
       console.log("best selling category",bestSellingCategory)


       const bestSellingBrand = await Order.aggregate([
         { $unwind: "$products" },
         {
           $lookup: {
             from: "products", // Assuming there's a collection named "products"
             localField: "products.productId",
             foreignField: "_id",
             as: "productDetails"
           }
         },
         { $unwind: "$productDetails" },
         {
           $group: {
             _id: "$productDetails.brand", // Grouping by brand
             totalQuantity: { $sum: "$products.quantity" }
           }
         },
         { $sort: { totalQuantity: -1 } },
         { $limit: 10 } // Only getting the top-selling brand
       ]);

       console.log("best selling brand",bestSellingBrand )

      res.render('dashboard',{ordersCount,totalRevenue,productsCount,categoryCount,
                               ordCount, cCount, bestSellingProduct, bestSellingCategory, bestSellingBrand });
   } catch (error) {
      console.log(error.message);
   }
};

const getLogout = async (req, res) => {
   try {
      console.log("inside admin logout")
       req.session.admin = null
       res.redirect("/admin/login")
   } catch (error) {
       console.log(error.message);
   }
}


const loadSalesReport = async(req,res)=>{
  try{
     const orders = await Order.aggregate([{$match:{orderStatus:'Delivered'}},{$sort:{date:-1}}]);
     console.log("orders inside loadSales report", orders)

     // Calculate totals
     const totalSalesCount = orders.length;
     const totalOrderAmount = Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100;
        const totalDiscountAmount = Math.round(orders.reduce((sum, order) => sum + order.couponDiscount, 0) * 100) / 100;
        const totalPaidAmount = Math.round(orders.reduce((sum, order) => sum + order.actualTotalAmount, 0) * 100) / 100;

     res.render('sales-report',{orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount});
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

      const today = new Date();
      if(number === '0'){ // All time report

         // Finding data using aggregate
         const orders = await Order.aggregate([{$match:{orderStatus:'Delivered'}},{$sort:{date:-1}}]);
        // Calculate totals
        const totalSalesCount = orders.length;
        const totalOrderAmount = Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100;
        const totalDiscountAmount = Math.round(orders.reduce((sum, order) => sum + order.couponDiscount, 0) * 100) / 100;
        const totalPaidAmount = Math.round(orders.reduce((sum, order) => sum + order.actualTotalAmount, 0) * 100) / 100;
     
        res.json({ orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount });


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
               totalAmount: 1,
               couponDiscount: 1,
               actualTotalAmount:1,
            }},
            {$sort:{date:-1}}
         ]);
          // Calculate totals
            const totalSalesCount = orders.length;
            const totalOrderAmount = Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100;
            const totalDiscountAmount = Math.round(orders.reduce((sum, order) => sum + order.couponDiscount, 0) * 100) / 100;
            const totalPaidAmount = Math.round(orders.reduce((sum, order) => sum + order.actualTotalAmount, 0) * 100) / 100;
         
         res.json({ orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount });

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
               totalAmount: 1,
               couponDiscount: 1,
               actualTotalAmount:1
            }},
            {$sort:{date:-1}}
         ])
         console.log("orders inside weekly report ", orders);
         // Calculate totals
        const totalSalesCount = orders.length;
        const totalOrderAmount = Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100;
        const totalDiscountAmount = Math.round(orders.reduce((sum, order) => sum + order.couponDiscount, 0) * 100) / 100;
        const totalPaidAmount = Math.round(orders.reduce((sum, order) => sum + order.actualTotalAmount, 0) * 100) / 100;
     
        res.json({ orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount });

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
             totalAmount: 1,
             couponDiscount: 1,
             actualTotalAmount:1
          }},
          {$sort:{date:-1}}
       ])
       // Calculate totals
        const totalSalesCount = orders.length;
        const totalOrderAmount = Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100;
        const totalDiscountAmount = Math.round(orders.reduce((sum, order) => sum + order.couponDiscount, 0) * 100) / 100;
        const totalPaidAmount = Math.round(orders.reduce((sum, order) => sum + order.actualTotalAmount, 0) * 100) / 100;
     
        res.json({ orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount });

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
               totalAmount: 1,
               couponDiscount: 1,
               actualTotalAmount:1
            }},
            {$sort:{date:-1}}
         ])
          // Calculate totals
        const totalSalesCount = orders.length;
        const totalOrderAmount = Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) * 100) / 100;
        const totalDiscountAmount = Math.round(orders.reduce((sum, order) => sum + order.couponDiscount, 0) * 100) / 100;
        const totalPaidAmount = Math.round(orders.reduce((sum, order) => sum + order.actualTotalAmount, 0) * 100) / 100;
     
        res.json({ orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount });

      }
      // res.render('sales-report')
   } catch (error) {
      console.log(error.message);
   }
}

const dateWiseSales = async(req,res)=>{
  try {
   console.log("iam inside datewise sales")
     let {startingDate , endingDate} = req.body
     console.log('Started :',startingDate)
     console.log('End :',endingDate)
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
           totalAmount: 1,
           couponDiscount: 1,
           actualTotalAmount:1
        }},
        {$sort:{date:-1}}
     ])
     console.log(orders)
       // Calculate totals
       const totalSalesCount = orders.length;
       const totalOrderAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
       const totalDiscountAmount = orders.reduce((sum, order) => sum + order.couponDiscount, 0);
       const totalPaidAmount = orders.reduce((sum, order) => sum + order.actualTotalAmount, 0);
    
       res.json({ orders,totalSalesCount,totalOrderAmount,totalDiscountAmount,totalPaidAmount });
  } catch (error) {
     console.log(error.message);
  }
}
// Generate sales report in pdf
const generateSalesPdf = async (req, res) => {
   console.log("inside generate sales pdf")
   try {
      const doc = new PDFDocument();
      const filename = 'sales-report.pdf';
      const orders = req.body;
  
      // Set content type to PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
      // Pipe the PDF kit to the response
      doc.pipe(res);
  
      // Add content to the PDF
      doc.fontSize(16).text('Sales Report', { align: 'center' });
  
      const margin = 10; // 1 inch margin
  
      // Draw the border
      doc.moveTo(margin, margin)
          .lineTo(600 - margin, margin)
          .lineTo(600 - margin, 842 - margin)
          .lineTo(margin, 842 - margin)
          .lineTo(margin, margin)
          .lineWidth(3)
          .strokeColor('#000000')
          .stroke();
  
      doc.moveDown();
  
      // Define table headers
      const headers = ['Order ID', 'Date', 'Total', 'Discount', 'Paid'];

       // Define column widths
    const firstColumnWidth = 180;
    const otherColumnsWidth = (600 - margin * 2 - firstColumnWidth) / (headers.length - 1); // Adjust remaining space

  
      // Calculate position for headers
      let headerX = 20;
      let headerY = doc.y + 10;
  
      // Set font size for headers
      doc.fontSize(12);
  
      // Draw headers
      headers.forEach((header, index) => {
         const columnWidth = index === 0 ? firstColumnWidth : otherColumnsWidth;
         doc.text(header, headerX, headerY, { width: columnWidth, align: 'center' });
         headerX += columnWidth; // Adjust spacing based on column width
     });
  
      // Calculate position for data
      let dataY = headerY + 20;
  
      // Draw data
      orders.forEach(order => {
         let dataX = 20;
         doc.text(order.orderId, dataX, dataY, { width: firstColumnWidth, align: 'center' });
         dataX += firstColumnWidth;
         doc.text(order.date, dataX, dataY, { width: otherColumnsWidth, align: 'center' });
         dataX += otherColumnsWidth;
         doc.text(`₹ ${order.totalAmount}`, dataX, dataY, { width: otherColumnsWidth, align: 'center' });
         dataX += otherColumnsWidth;
         doc.text(`₹ ${order.discountAmount}`, dataX, dataY, { width: otherColumnsWidth, align: 'center' });
         dataX += otherColumnsWidth;
         doc.text(`₹ ${order.paidAmount}`, dataX, dataY, { width: otherColumnsWidth, align: 'center' });
         dataX += otherColumnsWidth;
         // doc.text(`₹ ${order.totalAmount - order.discountAmount - order.paidAmount}`, dataX, dataY, { width: otherColumnsWidth, align: 'center' });
         dataY += 25; // Adjust spacing as needed
  
          // Check if we need a new page
          if (dataY > 800) { // Adjust based on the page size and margins
              doc.addPage();
              dataY = 20; // Reset dataY for the new page
          }
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
                    loadDashboard,
                    downloadExcel,
                    loadSalesReport,
                    filterSales,
                    dateWiseSales,
                    generateSalesPdf,
                    getLogout
                  };
