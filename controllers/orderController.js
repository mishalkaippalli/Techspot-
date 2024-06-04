const User = require("../models/userSchema")
const Category = require("../models/categorySchema");
const Cart = require('../models/cartModel')
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Wallet = require('../models/walletSchema');
const Order = require("../models/orderSchema");
const Coupon = require("../models/couponSchema")
const userUsedCoupons = require('../models/usedCouponSchema');
const mongodb = require("mongodb")
const CartCountHelper = require('../associates/cartItemsCount');
const fs = require('fs');
const {Readable} = require('stream');
const RazorPayHelper = require('../associates/razorpayHelper');
const express = require('express')
const app = express()
const fetch = require("node-fetch");
require("dotenv/config");
const path = require("path");

const paypal = require('@paypal/checkout-server-sdk')
// const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT} = process.env;
const base = "https://api-m.sandbox.paypal.com";


const placeOrder = async(req,res)=>{
    try {
      console.log(":inside place order")
       const user_id = req.session.user._id;
       console.log("use_id", user_id)
       // Finding the user
       const cart = await Cart.findOne({userId:user_id}).populate('products.productId');
       console.log(cart)
       const {totalAmount,paymentMethod,couponDiscount,actualAmount,addressId,couponId} = req.body;
       // console.log(totalAmount)
       // console.log(paymentMethod)
       // console.log(addressId)
       // console.log(user_id)
       // console.log(cart.products)
       // console.log(couponId)
 
       //=== Coupon Mangement=====
       if(couponId){
          const usedCoupons = await userUsedCoupons.findOne({userId:user_id});
          if(!usedCoupons){
            console.log("inside !usedCoupons")
             usedCoupons = new userUsedCoupons({
                userId:user_id,
                userCoupons:[{couponId:couponId}]
             })
          }else{
             usedCoupons.userCoupons.push({couponId});
          }
          await usedCoupons.save()
       }
 
       const productData = cart.products;
       console.log("inside placeorder product data from cart is",productData )
       let orderedProducts=[];
       productData.forEach(async(product)=>{
          const products ={
             productId:product.productId._id,
             quantity:product.quantity,
             salePrice:product.productId.salePrice,
             total:product.total,
             productStatus:'Placed'
          }
          orderedProducts.push(products);
       })
       // console.log(orderedProducts)
 
 
       const userAddress = await Address.findOne({userId:user_id})
       console.log("userAddress",userAddress )
       const shippingAddress = userAddress.address.find(address=>address._id.toString()===addressId);
       console.log("shipping address", shippingAddress)
 
       // Address --
       const address = {
          name:shippingAddress.name,
          mobile:shippingAddress.mobile,
          homeAddress:shippingAddress.homeAddress,
          city:shippingAddress.city,
          state:shippingAddress.state,
          postalCode:shippingAddress.postalCode
       }
       console.log(address);
 
       const orderDetails = new Order({
          userId:user_id,
          totalAmount:totalAmount,
          couponDiscount:couponDiscount,
          actualTotalAmount:actualAmount,
          paymentMethod:paymentMethod,
          products:orderedProducts,
          address:address,
       })
       const placedOrder = await orderDetails.save()
       console.log("placed order", placedOrder);
 
       // Payment method integration 
       // ==== COD====
       if(placedOrder.paymentMethod === 'COD'){
          placedOrder.orderStatus = 'Placed'
          await placedOrder.save();
          if(cart){
             cart.products = [];
             await cart.save();
          }
          // Reducing the product stock
          productData.forEach(async(product)=>{
             product.productId.quantity -=product.quantity;
             await product.productId.save()
          })
          res.json({status:'COD',placedOrderId:placedOrder._id})
 
          // === WALLET===
       }else if(placedOrder.paymentMethod === 'WALLET'){
          // Taking the wallet of user 
          let userWallet = await Wallet.findOne({userId:user_id});
          if(!userWallet){
             userWallet = new Wallet({userId:user_id});
             await userWallet.save();
          }
          const walletAmount = userWallet.walletAmount;
          // console.log('Wallet amount is :',walletAmount)
          if(walletAmount){
             userWallet.walletAmount = walletAmount - actualAmount;
             const amount = (-1*actualAmount);
             userWallet.transactionHistory.push(amount);
             await userWallet.save()
             placedOrder.orderStatus = 'Placed'
             await placedOrder.save();
             if(cart){
                cart.products = [];
                await cart.save();
             }
             productData.forEach(async(product)=>{
                product.productId.quantity -=product.quantity;
                await product.productId.save()
             })
             return res.json({status:'WALLET',placedOrderId:placedOrder._id});
          }
 
          // ===RAZORPAY===
       }else if(placedOrder.paymentMethod === 'RAZORPAY'){
          const orderId = placedOrder._id;
          const totalAmount = placedOrder.actualTotalAmount;
          console.log("inside razorpay",orderId, totalAmount)
          // Calling razorpay 
          RazorPayHelper.generateRazorPay(orderId,totalAmount).then((response)=>{
            console.log("response form razorpay created data response", response)
             res.json({status:'RAZORPAY',response})
             
          })
          if(cart){
            console.log("inside if cart in palceorder")
             cart.products = [];
             await cart.save();
          }
          productData.forEach(async(product)=>{
             product.productId.quantity -=product.quantity;
             await product.productId.save()
          })
 
       }
    } catch (error) {
       console.log(error.message);
    }
 }

//  Verify online payment
const verifyOnlinePayment = async(req,res)=>{

    const user_id = req.session.user._id;
    const data = req.body
    console.log(data)
    // console.log('Our orderId : ',req.body.order.receipt);
    let receiptId = data.order.receipt;
    
    RazorPayHelper.verifyOnlinePayment(data).then(()=>{
       console.log('Resolved')
 
       // If it is from wallet then only it works
 
       if(data.from === 'wallet'){
          const amount = (data.order.amount)/100;
          Wallet.findOneAndUpdate({userId:user_id},{$inc:{walletAmount:amount},$push:{transactionHistory:amount}},{new:true})
          .then((updatedWallet)=>{
             console.log('Wallet Updated :',updatedWallet)
             res.json({status:'rechargeSuccess',message:'Wallet Updated'});
          })
          .catch(()=>{
             console.log('Wallet Not updated');
             res.json({status:'error',message:'Wallet Not Updated'});
          })
       }else{
          let paymentSuccess = true;
 
          RazorPayHelper.updatePaymentStatus(receiptId,paymentSuccess).then(()=>{
             res.json({status:'paymentSuccess',placedOrderId:receiptId});
          })
       }
       
    }).catch((err)=>{
       console.log('Rejected')
       if(err){
          console.log(err.message);
 
          let paymentSuccess = false;
          RazorPayHelper.updatePaymentStatus(receiptId,paymentSuccess).then(()=>{
             res.json({status:'paymentFailed',placedOrderId:receiptId})
          })
       }
    })
    
 }

 const loadConfirmation = async(req,res)=>{
   try {
      const user_id = req.session.user._id;
      const orderId = req.query.orderId
      
      const orderDetails = await Order.findById(orderId).populate('products.productId')

      const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
      console.log(orderDetails.products)
      res.render('confirmation',{orderDetails,cartItemsCount});
   } catch (error) {
      console.log(error.message);
   }
}

//pendingg payment still order to be placed
const paymentPending = async(req, res)=>{
   try {
      // console.log("inside payment pending", req.body)
      let orderId = req.body.orderId
      orderId = new Object(orderId)
      if(orderId){
         console.log("order id inside payment pending", orderId)
         const orderUpdate = await Order.findByIdAndUpdate({_id: orderId },{$set:{orderStatus:'payment pending'}})
         .then(()=>{
            return res.json({status:'ordersuccesspaymentpending'})
         })}
   } catch (error) {
      console.log(error.message)
   }
}

// List orders in user-side
const listOrders = async(req,res)=>{
   try {
      console.log("req.session.user._id",req.session.user._id)
      const user_id = req.session.user._id;
      const userData = await User.findById(user_id)
      console.log("userdata",userData)
      const userOrders = await Order.find({userId:user_id}).populate('products.productId');
      const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
      res.render('list-orders',{userOrders,cartItemsCount,userData});
   } catch (error) {
      console.log(error.message);
   }
}

// When user click into the details 
const orderDetails = async(req,res)=>{
   try {
      const user_id = req.session.user._id;
      console.log("user_id",user_id)
      const userData = await User.findById(user_id)
      console.log("userdata",userData)
      const orderId = req.query.orderId;
      const orderDetails = await Order.findById(orderId).populate('products.productId').sort({date:1})
      // console.log(orderDetails)
      const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
      res.render('order-details',{orderDetails,cartItemsCount,userData});
   } catch (error) {
      console.log(error.message);
   }
}
// Cancel order
const cancelOrder = async(req,res)=>{
   try {
      const orderId = req.query.orderId;
      const orderDetails = await Order.findByIdAndUpdate(orderId,
         {$set:{
            orderStatus:'Cancelled'
         }},
         {new:true}
         ).populate('products.productId');

         if(orderDetails.paymentMethod !== 'COD'){
            const userWallet = await Wallet.findOne({userId:req.session.user._id});
            if(!userWallet){
               userWallet = new Wallet({userId:req.session.user._id});
               await userWallet.save();
            }
               const amount = (1*orderDetails.actualTotalAmount)
               userWallet.walletAmount += orderDetails.actualTotalAmount;
               userWallet.transactionHistory.push(amount);
               await userWallet.save();
      
         }
         // Re setting the products stock
         orderDetails.products.forEach((products)=>{
            // console.log(products.productId.stock)
            products.productId.quantity += products.quantity;
            // console.log(products.productId.stock)
         })
         await orderDetails.save();
         // console.log(userWallet);
         res.json({status:'success',message:'Order Cancelled'});
   } catch (error) {
      res.json({status:'error',message:'Something went wrong'});
      console.log(error.message)
   }
}

// Return Order
const returnOrder = async(req,res)=>{
   try {
      const {reason, orderId, selectedItems} = req.body
      console.log(reason);
      console.log(orderId)
      console.log(selectedItems);

      const order = await Order.findById(orderId);
      

      for(let i = 0;i<selectedItems.length;i++){
         // selected the particular Id
         const productId = selectedItems[i];

         const productIndex = order.products.findIndex((product)=>product.productId.toString() === productId);

         if(productIndex !== -1){
            order.products[productIndex].productStatus = 'Return Requested'
         }
      }

      order.returnOrderStatus.status = 'requested';
      order.returnOrderStatus.reason = reason;

      await order.save();
      
      res.json({status:'success',message:'Request Send'});

   } catch (error) {
      res.json({status:'error',message:'Something went wrong'});
      console.log(error.message);
   }
}


// ==============================Admin Order management=================


// Admin can view the order list
const loadOrdersPage = async(req,res)=>{
    try {
       const orders = await Order.find({}).sort({date: -1})
       console.log("orders", orders)
       res.render('list-orders',{orders});
    } catch (error) {
       console.log(error.message);
    }
 }


// Admin can view the order specific details
const adminOrderDetails = async(req,res)=>{
    try {
       const orderId = req.query.orderId
       console.log("orderId", orderId);
       const orderDetails = await Order.findById(orderId).populate('products._id')
       console.log("inside adminorderdetails orderdetails.product is",orderDetails)
       res.render('order-details',{orderDetails});
    } catch (error) {
       console.log(error.message);
    }
 }

// Admin can change the order status
const changeStatus = async(req,res)=>{
   try {
      const {orderId, orderStatus} = req.body;
      // console.log(orderId)
      // console.log(orderStatus)
      const orderData = await Order.findById(orderId).populate('products.productId');
      console.log("changeStatus orderdata is ",orderData)
      if(orderData){
         if(orderStatus === 'Returned'){
            // Checking if whole product is returned the whole order will returned;
            const status = orderData.products.filter(product => {
               return (product.productStatus !== 'Return Requested' && product.productStatus !== 'Returned');
           });
           if(status.length === 0){
               orderData.orderStatus = orderStatus;
           }
            orderData.returnOrderStatus.status = 'Approved'

            const returnAmount = orderData.products.reduce((acc,product)=>{
               if( product.productStatus === 'Return Requested'){
                  return acc += product.total;
               }
               return acc;
            },0);
            // console.log(returnAmount);

            // Return the particular element stock
            // Return the particular element stock
            orderData.products.forEach(async (product) => {
               if (product.productStatus === 'Return Requested') {
                  product.productId.stock += product.quantity;

                  // Save the product after updating its stock
                  await product.productId.save();
               }
            });

         //   console.log('Order : ', orderData.products);

            // Returning the particular items
            orderData.products.map((product)=>{
               if( product.productStatus === 'Return Requested'){
                  product.productStatus = 'Returned';
               }
            })
            // console.log(orderData);
            // Returning the amount into the wallet of user 
            const userWallet = await Wallet.findOne({userId:orderData.userId});
            if(userWallet){
               const amount = (1*returnAmount);
               userWallet.walletAmount += amount;
               userWallet.transactionHistory.push(amount);
               await userWallet.save();
            }
                      
         }else if (orderStatus === 'Delivered'){
            orderData.products.map((product)=>{
               return product.productStatus = 'Delivered';
            });
            orderData.orderStatus = orderStatus;
            orderData.deliveredDate = Date.now();
         }else{
            orderData.orderStatus = orderStatus;
         }
         await orderData.save();
         console.log("changed order data", orderData);
      }
         // console.log(orderData);
      res.json({status:'success',message:'Status Updated'});
   } catch (error) {
      res.json({status:'error',message:'Something went wrong'});
      console.log(error.message)
   }
}

// Invoice
const invoice = async (req, res) => {
   const easyinvoice = require('easyinvoice');

   try {
      const orderId = req.query.orderId;
      const orderDetails = await Order.findById(orderId).populate([
         {
            path: 'userId'
         },
         {
            path: 'products.productId'
         }
      ]);
      console.log("Result :", orderDetails)

      const products = orderDetails.products.map(product => ({
         quantity: product.quantity,
         description: product.productId.productName, // Assuming description is available in the order
         price: product.salePrice, // Assuming salePrice is the correct price
         total: orderDetails.totalAmount,
         "tax-rate": 0, // Assuming tax-rate is 0
      }));
      //  console.log(products);

      // To format to the date into simplest form
      const isoDateString = orderDetails.date;
      console.log("Date before changing",isoDateString)
      const isoDate = new Date(isoDateString);
      console.log("date afrer",isoDate)

      const options = { year: "numeric", month: "long", day: "numeric" };
      const formattedDate = isoDate.toLocaleDateString("en-US", options);
      console.log(formattedDate)
      console.log(orderDetails)
      const data = {
         customize: {
            //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
         },
         images: {
            // The invoice background
            background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
         },
         // Your own data
         sender: {
            company: "Techspot",
            address: "kerala",
            city: "Kochi",
            country: "India",
         },
         client: {
            company: "Customer Address",
            "zip": orderDetails.address.postalCode,
            "city": orderDetails.address.city,
            "address": orderDetails.address.homeAddress + ' ' + orderDetails.address.street,
            // "custom1": "custom value 1",
            // "custom2": "custom value 2",
            // "custom3": "custom value 3"
         },
         information: {
            // Invoice number
            number: orderDetails._id,
            // ordered date
            date: formattedDate,
         },
         products: products,
         "bottom-notice": "Happy shopping and visit Techspot again",
      };

       console.log("data",data)
      const pdfResult = await easyinvoice.createInvoice(data);
       console.log("pdfresult", pdfResult)
      const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");
       console.log("pdfBuffer", pdfBuffer)
      // Set HTTP headers for the PDF response
      res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
      res.setHeader("Content-Type", "application/pdf");

      // Create a readable stream from the PDF buffer and pipe it to the response
      const pdfStream = new Readable();
      pdfStream.push(pdfBuffer);
      console.log("pdfStream", pdfStream)

      pdfStream.push(null);
      //  console.log(pdfStream)

      pdfStream.pipe(res);
   } catch (error) {
      console.log(error.message);
   }
}

// const paypalpage = async (req, res) => {
//     try {
        
//         console.log("Iam inside paypalpage in order controller")
//         const orderDetails = req.query.response
//         // console.log(orderDetails)
//         // const orderId = req.query.response.orderId;
//         // console.log(orderId)
//         // const fullorderdetails = await Order.find({_id: orderId})
//         // console.log("inside paypal page from mongodb", fullorderdetails);
//         // const cartwithidandquantity = fullorderdetails.product.map( product => ({
//         //     _id: product._id,
//         //     quantity: product.quantity}))
//         const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
//         console.log(PAYPAL_CLIENT_ID, "PAYPAL_CLIENT_ID")
//         const PAYPAL_CLIENT_SECRET= process.env.PAYPAL_CLIENT_SECRET
//         res.render("index",{ order: orderDetails, paypalClientId: PAYPAL_CLIENT_ID, paypalClientSecret: PAYPAL_CLIENT_SECRET})
//     } catch (error) {
//         console.log(error.message)
//     }
// }

// const paypalordercreator = async(req, res) => {

//     const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
//         console.log(PAYPAL_CLIENT_ID, "PAYPAL_CLIENT_ID")
//         const PAYPAL_CLIENT_SECRET= process.env.PAYPAL_CLIENT_SECRET

//         const products = new Map([
//             [1, {price: 100, name: "s24 ultra"}],
//             [2, {price: 200, name: "iphone 15 plus"}],
//         ])

//             const { cart } = req.body;
//             console.log("inside app.post /api.orders, cart is ", cart)
//             const { jsonResponse, httpStatusCode } = await createOrder(cart);
//             res.status(httpStatusCode).json(jsonResponse);


    
//     try {    
//         const generateAccessToken = async () => {
//             try {
//               if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
//                 throw new Error("MISSING_API_CREDENTIALS");
//               }
//               const auth = Buffer.from(
//                 PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
//               ).toString("base64");
//               const response = await fetch(`${base}/v1/oauth2/token`, {
//                 method: "POST",
//                 body: "grant_type=client_credentials",
//                 headers: {
//                   Authorization: `Basic ${auth}`,
//                 },
//               });
              
//               const data = await response.json();
//               return data.access_token;
//             } catch (error) {
//               console.error("Failed to generate Access Token:", error);
//             }
//           };
          

//         const createOrder = async (cart) => {
//             // use the cart information passed from the front-end to calculate the purchase unit details
//             console.log(
//               "shopping cart information passed from the frontend createOrder() callback:",
//               cart,
//             );
            
//             const total = 200
//             const accessToken = await generateAccessToken();
//             const url = `${base}/v2/checkout/orders`;
           
//             const payload = {
//               intent: "CAPTURE",
//               purchase_units: [
//                 {
//                   amount: {
//                     currency_code: "EUR",
//                     value: total,
//                   },
//                 },
//               ],
//             };

            
            
//             const response = await fetch(url, {
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${accessToken}`,
//                 // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
//                 // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
//                 // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
//                 // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
//               //   "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
//                },
//               method: "POST",
//               body: JSON.stringify(payload),
//             });
            
//             return handleResponse(response);
//         };

//         const captureOrder = async (orderID) => {
//             const accessToken = await generateAccessToken();
//             const url = `${base}/v2/checkout/orders/${orderID}/capture`;
            
//             const response = await fetch(url, {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${accessToken}`,
//                 // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
//                 // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
//                 // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
//                 // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
//                 // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
//               },
//             });
            
//             return handleResponse(response);
//           };

//           async function handleResponse(response) {
//             try {
//               const jsonResponse = await response.json();
//               return {
//                 jsonResponse,
//                 httpStatusCode: response.status,
//               };
//             } catch (err) {
//               const errorMessage = await response.text();
//               throw new Error(errorMessage);
//             }
//           }
          
//           try {
//             const { orderID } = req.params;
//             const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
//             res.status(httpStatusCode).json(jsonResponse);
//           } catch (error) {
//             console.error("Failed to create order:", error);
//             res.status(500).json({ error: "Failed to capture order." });
//           }

//     } catch (error) {
//         console.error("Failed to create order:", error);
//         res.status(500).json({ error: "Failed to create order." });
//     }
// }



module.exports = {
                   
                   loadOrdersPage,
                   adminOrderDetails,
                   changeStatus,
                   placeOrder,
                   verifyOnlinePayment,
                   loadConfirmation,
                   listOrders,
                   orderDetails,
                   cancelOrder,
                   returnOrder,
                   invoice,
                   paymentPending
                  }