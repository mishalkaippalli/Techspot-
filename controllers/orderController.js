const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const Coupon = require("../models/couponSchema")
const mongodb = require("mongodb")
const { ObjectId } = require('mongodb');

const express = require('express')
const app = express()
const fetch = require("node-fetch");
require("dotenv/config");
const path = require("path");

const paypal = require('@paypal/checkout-server-sdk')
// const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT} = process.env;
const base = "https://api-m.sandbox.paypal.com";

const getCheckoutPage = async(req, res) => {
    try {
        console.log("I am inside getcheckoutpage in ordercontroller, request query is", req.query);
        //isSingle is for buying one product for buy now
        if(req.query.isSingle == "true") {   
            const id = req.query.id
            const findProduct = await Product.find({id: id}).lean()
            const userId = req.session.user
            const findUser = await User.findOne({_id: userId})
            const addressData = await Address.findOne({userId: userId})
            console.log("addressdata: ",addressData)
            console.log("findproduct", findProduct);

            const today = new Date().toISOString(); 

            const findCoupons = await Coupon.find({
                isList: true,
                createdOn: {$lt: new Date(today)},
                expireOn: {$gt: new Date(today)},
                minimumPrice: {$lt: findProduct[0].salePrice}
            });
            console.log(findCoupons, "this is coupon");

            res.render("checkout", {product: findProduct, user: userId, findUser: findUser,
                                     userAddress: addressData, isSingle: true, coupons: findCoupons}) 
        } else {                             
            const user = req.query.userId
            const findUser = await User.findOne({_id: user})
            console.log(findUser);
            const addressData = await Address.findOne({userId: user})
            const oid = new mongodb.ObjectId(user);
            const data = await User.aggregate([
                {$match: {_id: oid}},
                {$unwind: "$cart"},
                {
                    $project: {
                        proId: {'$toObjectId': '$cart.productId'},
                        quantity: "$cart.quantity"
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'proId',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
            ])

            const grandTotal = req.session.grandTotal
            console.log("grandtotal", grandTotal)
            const today = new Date().toISOString();

            const findCoupons = await Coupon.find({
                isList: true,
                createdOn: {$lt: new Date(today)},
                expireOn: {$gt: new Date(today)},
                minimumPrice: {$lt: grandTotal}
            });
            console.log("coupons", findCoupons);

            res.render("checkout", {data: data, user: findUser, isCart: true,
                 userAddress: addressData, isSingle: false, grandTotal, coupons: findCoupons })   
        }
    } catch (error) {
        console.log(error.message)
    }
}

const orderPlaced = async (req, res) => {
    try {
        console.log("req.body => ", req.body);
        // if(req.body.isSingle === "true"){
        //     const {totalPrice, addressId, payment, productId } = req.body
        //     const userId = req.session.user
        //     console.log(req.session.grandTotal, "from session");
        //     const grandTotal = req.session.grandTotal
        //     console.log(req.body)
        //     console.log(totalPrice, addressId, payment, productId )
        //     const findUser = await User.findOne({_id: userId})
        //     console.log("finduser", findUser)
        //     const address = await Address.findOne({userId: userId})
        //     console.log("address",address);
        //     // const findAddress = address.find(item => item._id.toString()=== addressId);
        //     const findAddress = address.address.find(item => item._id.toString() === addressId)
        //     console.log(findAddress);
        //     console.log("before product search")
        //     const findProduct = await Product.findOne({_id: productId})
        //     console.log(findProduct);

        //     const productDetails = {
        //         _id: findProduct._id,
        //         price: findProduct.salePrice, 
        //         name: findProduct.productName,
        //         image: findProduct.productImage[0],
        //         quantity: 1
        //     }
        //     console.log("before order placing")

        //     const newOrder = new Order(({
        //         product: productDetails,
        //         totalPrice: grandTotal,
        //         address: findAddress,
        //         payment: payment,
        //         userId: userId,
        //         createdOn: Date.now(),
        //         status: 'Confirmed'
        //     }))

        //     console.log("order placed")
        //     findProduct.quantity = findProduct.quantity - 1

        //     let orderDone;

        //     if(newOrder.payment == 'cod'){
        //         console.log('order placed with COD');
        //         await findProduct.save()
        //         orderDone = await newOrder.save()
        //         res.json({payment: true, method: "cod", order: orderDone, quantity: 1, orderId: userId})
        //     } else if(newOrder.payment == 'online'){
        //         console.log('order placed by razorpay');
        //         orderDone = await newOrder.save()
        //         const generatedOrder = await generatedOrderRazorpay(orderDone._id, orderDone.totalPrice);
        //         console.log(generatedOrder, "order generated");
        //         await findProduct.save()
        //         res.json({payment: false, method: 'online', razorpayOrder: generatedOrder,
        //                   order: orderDone, orderId: orderDone._id, quantity: 1 })
        //     } else if (newOrder.payment == 'wallet') {
        //         if(newOrder.totalPrice <= findUser.wallet){
        //             console.log("order placed with wallet");
        //             const data = findUser.wallet -= newOrder.totalPrice;
        //             const newHistory = {
        //                 amount: data,
        //                 status: 'debit',
        //                 data: Date.now()
        //             };
        //             findUser.history.push(newHistory);
        //             await findUser.save()
        //             await findProduct.save()
        //             orderDone = await newOrder.save()

        //             res.json({payment: true, method: 'wallet', order: orderDone, orderId: orderDone._id,
        //                         quantity: 1, successs: true }); return;
        //         } else {
        //             console.log("wallet amount is lesser than total amount");
        //             res.json({payment: false, method: "wallet", success: false});
        //             return;
        //         }
        //     }

        // } else {
            console.log("from cart")

            const {totalPrice, addressId, payment} = req.body
            console.log(totalPrice, addressId, payment);

            const userId = req.session.user
            const findUser = await User.findOne({_id: userId})
            console.log("finduser",findUser)
            const productIds = findUser.cart.map(item => item.productId)
            console.log("productids", productIds)
            const grandTotal = req.session.grandTotal
            console.log(grandTotal, "grandTotal");
            //const address = await Address.findOne({userId: userId})
         
            const findAddress = await Address.findOne({'address._id': addressId})

            if(findAddress){
                const desiredAddress = findAddress.address.find(item => item._id.toString() === addressId.toString());
                //console.log(desired Address)

                const findProducts = await Product.find({_id: {$in: productIds}})

                const cartItemQuantities = findUser.cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))

                console.log("cartItemQuantities", cartItemQuantities)


                const orderedProducts = findProducts.map((item) => ({
                    _id: item._id,
                    price: item.salePrice,
                    name: item.productName,
                    image: item.productImage[0],
                    quantity: (() => {
                        const cartItem = cartItemQuantities.find(cartItem =>
                            cartItem.productId.toString() === item._id.toString()
                        );
                        return cartItem ? cartItem.quantity : 0; // Return quantity if cartItem is found, otherwise return 0
                    })()
                }));

                const newOrder = new Order({
                    product: orderedProducts,
                    totalPrice: grandTotal,
                    address: desiredAddress,
                    payment: payment,
                    userId: userId,
                    status: 'Confirmed',
                    createdOn: Date.now()
                })
                console.log("inside ordercontroller.js new order is",newOrder)

                await User.updateOne(
                    {_id: userId},
                    {$set: {cart: []}}
                );

                for(let i = 0; i < orderedProducts.length; i++){
                    const product = await Product.findOne({_id: orderedProducts[i]._id});
                    if(product) {
                        const newQuantity = product.quantity - orderedProducts[i].quantity;
                        product.quantity = Math.max(newQuantity, 0);
                        await product.save();
                    }
                }
              let orderDone
              if(newOrder.payment == 'cod') {
                console.log('order placed by cod');
                orderDone = await newOrder.save();
                res.json({payment: true, method: "cod", order: orderDone, quantity: cartItemQuantities, orderId: findUser})
              } else if(newOrder.payment == 'online') {
                console.log('order placed by paypal')
                orderDone = await newOrder.save();
                console.log("insiden orderplaced orderDone._id is", orderDone._id);
                console.log("inside paypal option order id done is", orderDone)
                // const generatedOrder = await generatedOrderPaypal(orderDone._id, orderDone.totalPrice);
                // console.log(generatedOrder, "order generated")
                res.json({ payment: false, method: "online", order: orderDone, orderId: orderDone._id, productIdAndQuantity: cartItemQuantities });
              } else if (newOrder.payment == "wallet") {
                if(newOrder.totalPrice <= findUser.wallet) {
                    console.log("order placed with wallet");
                    const data = findUser.wallet -= newOrder.totalPrice
                    const newHistory = {
                        amount: data,
                        status: "debit",
                        date: Date.now()
                    }
                    findUser.history.push(newHistory)
                    await findUser.save()

                    orderDone = await newOrder.save()

                    res.json({ payment: true, method: "wallet", order: orderDone, orderId: orderDone._id, quantity: cartItemQuantities, success: true })
                    return;
                } else {
                    console.log('wallet amount is lesser than total amount');
                    res.json({payment: false, method: 'wallet', success: false});
                    return;
                }
              }
            } else {
                console.log('Address not found')
            }
        // }
    } catch (error) {
        console.log(error.message)
    }
}

const getOrderDetailsPage = async(req, res) => {
    try {
        const userId = req.session.user
        const orderId = req.query.id
        const findOrder = await Order.findOne({_id: orderId})
        const findUser = await User.findOne({_id: orderId})
        console.log(findOrder, findUser);
        res.render("orderDetails", {orders: findOrder, user: findUser, orderId})
    } catch (error) {
        console.log(error.message)
    }
}

const getOrderDetailsPageAdmin = async(req, res) => {
    try {
        const orderId = req.query.id
        console.log(orderId);
        const findOrder = await Order.findOne({_id: orderId}).sort({createdOn: 1})
        // console.log(findOrder)

        res.render("order-details-admin", {orders: findOrder, orderId})
    } catch (error) {
        console.log(error.message)
    }
}

const cancelOrder = async(req, res) => {
    try {
        const userId = req.session.user
        console.log("Iam inside cancelOrder in orderController, userid is: ", userId)
        const findUser = await User.findOne({_id: userId})

        if(!findUser) {
            return res.status(404).json({message: 'User not found'});
        }

        const orderId = req.query.orderId
        console.log("order Id from query is", orderId)

        await Order.updateOne({_id: orderId},{status: "Canceled"})
            .then((data) => console.log(data))
        
        const findOrder = await Order.findOne({_id: orderId})
        console.log("find order", findOrder)

        if(findOrder.payment === "wallet" || findOrder.payment === "online"){
            findUser.wallet += findOrder.totalPrice;

            const newHistory = {
                amount: findOrder.totalPrice,
                status: "credit",
                date: Date.now()
            }

            findUser.history.push(newHistory)
            await findUser.save();
        }
        
        for(const productData of findOrder.product) {

           const productId = productData._id;
           console.log("inside for productId: ",productId)
           const quantity = productData.quantity;
           console.log("inside for productId: ",quantity)

           const product = await Product.findById(productId);
           console.log("product", product)

           if(product) {
            product.quantity += quantity;
            await product.save()
           }
        }
        res.redirect('/profile#orders');

    } catch (error) {
        console.log(error.message)
    }
}

const getOrderListPageAdmin = async(req, res) => {
    try {
        const orders = await Order.find({}).sort({createdOn: -1});
        console.log(req.query)

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) *  itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("orders-list", {orders: currentOrder, totalPages, currentPage})
    } catch (error) {
        console.log(error.message)
    }
}

const changeOrderStatus = async(req, res) => {
    try {
        console.log("I am inside changeOrderStatus in order controller",req.query);

        const orderId = req.query.orderId
        console.log("orderid", orderId)

        await Order.updateOne({_id: orderId},
            {status: req.query.status})
            .then((data) => console.log(data))

        const findOrder = await Order.findOne({_id: orderId})
        res.redirect('/admin/orderList');

    } catch (error) {
        console.log(error.message)
    }
}
const returnOrder = async (req, res) => {
    try { 
        const userId = req.session.user
        const findUser = await User.findOne({_id: userId})
        console.log("Iam inside return order finduser is",findUser)

        if(!findUser) {
            return res.status(404).json({message: 'User not found'})
        }

        const id = req.query.id
        await Order.updateOne({_id: id},
        {status: "Returned"})
        .then((data) => console.log("updated inside return order, data is ",data))

        const findOrder = await Order.findOne({_id: id})

        if(findOrder.payment === "wallet" || findOrder.payment === "online"){
            findUser.wallet += findOrder.totalPrice;

            const newHistory = {
                amount: findOrder.totalPrice,
                status: "credit",
                date: Date.now()
            }
            findUser.history.push(newHistory)
            await findUser.save()
        }
        
        for (const productData of findOrder.product) {
            const productId = productData.ProductId;
            const quantity = productData.quantity;

            const product = await Product.findById(productId);

            if(product){
                product.quantity += quantity;
                await product.save();
            }
        }
        res.redirect('/profile#orders');

    } catch (error) {
        console.log(error.message)
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
                   getCheckoutPage,
                   orderPlaced,
                   getOrderDetailsPage,
                   cancelOrder,
                   getOrderListPageAdmin,
                   getOrderDetailsPageAdmin,
                   changeOrderStatus,
                   returnOrder,
                  }