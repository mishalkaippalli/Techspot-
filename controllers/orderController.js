const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const mongodb = require("mongodb")
const { ObjectId } = require('mongodb');

const getCheckoutPage = async(req, res) => {
    try {
        console.log("I am inside getcheckoutpage in usercontroller, request query is", req.query);
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

            // const findCoupons = await Coupon.find({
            //     isList: true,
            //     createdOn: {$lt: new Date(today)},
            //     expireOn: {$gt: new Date(today)},
            //     minimumPrice: {$lt: findProduct[0].salePrice}
            // });
            // console.log(findCoupons, "this is coupon");

            res.render("checkout", {product: findProduct, user: userId, findUser: findUser,
                                     userAddress: addressData, isSingle: true,}) //coupons to be added
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
                }
            ])

            const grandTotal = req.session.grandTotal
            console.log("grandtotal", grandTotal)
            const today = new Date().toISOString();

            // const findCoupons = await Coupon.find({
            //     isList: true,
            //     createdOn: {$lt: new Date(today)},
            //     expireOn: {$gt: new Date(today)},
            //     minimumPrice: {$lt: findProduct[0].salePrice}
            // });
            // console.log("coupons", findCoupons);

            res.render("checkout", {data: data, user: findUser, isCart: true,
                 userAddress: addressData, isSingle: false, grandTotal })      //coupons to be added
        }
    } catch (error) {
        console.log(error.message)
    }
}

const orderPlaced = async (req, res) => {
    try {
        console.log("req.body => ", req.body);
        if(req.body.isSingle === "true"){
            const {totalPrice, addressId, payment, productId } = req.body
            const userId = req.session.user
            console.log(req.session.grandTotal, "from session");
            const grandTotal = req.session.grandTotal
            console.log(req.body)
            console.log(totalPrice, addressId, payment, productId )
            const findUser = await User.findOne({_id: userId})
            console.log("finduser", findUser)
            const address = await Address.findOne({userId: userId})
            console.log("address",address);
            // const findAddress = address.find(item => item._id.toString()=== addressId);
            const findAddress = address.address.find(item => item._id.toString() === addressId)
            console.log(findAddress);
            console.log("before product search")
            const findProduct = await Product.findOne({_id: productId})
            console.log(findProduct);

            const productDetails = {
                _id: findProduct._id,
                price: findProduct.salePrice, 
                name: findProduct.productName,
                image: findProduct.productImage[0],
                quantity: 1
            }
            console.log("before order placing")

            const newOrder = new Order(({
                product: productDetails,
                totalPrice: grandTotal,
                address: findAddress,
                payment: payment,
                userId: userId,
                createdOn: Date.now(),
                status: 'Confirmed'
            }))

            console.log("order placed")
            findProduct.quantity = findProduct.quantity - 1

            let orderDone;

            if(newOrder.payment == 'cod'){
                console.log('order placed with COD');
                await findProduct.save()
                orderDone = await newOrder.save()
                res.json({payment: true, method: "cod", order: orderDone, quantity: 1, orderId: userId})
            } else if(newOrder.payment == 'online'){
                console.log('order placed by razorpay');
                orderDone = await newOrder.save()
                const generatedOrder = await generatedOrderRazorpay(orderDone._id, orderDone.totalPrice);
                console.log(generatedOrder, "order generated");
                await findProduct.save()
                res.json({payment: false, method: 'online', razorpayOrder: generatedOrder,
                          order: orderDone, orderId: orderDone._id, quantity: 1 })
            } else if (newOrder.payment == 'wallet') {
                if(newOrder.totalPrice <= findUser.wallet){
                    console.log("order placed with wallet");
                    const data = findUser.wallet -= newOrder.totalPrice;
                    const newHistory = {
                        amount: data,
                        status: 'debit',
                        data: Date.now()
                    };
                    findUser.history.push(newHistory);
                    await findUser.save()
                    await findProduct.save()
                    orderDone = await newOrder.save()

                    res.json({payment: true, method: 'wallet', order: orderDone, orderId: orderDone._id,
                                quantity: 1, successs: true }); return;
                } else {
                    console.log("wallet amount is lesser than total amount");
                    res.json({payment: false, method: "wallet", success: false});
                    return;
                }
            }

        } else {
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

                // const orderedProducts = findProducts.map((item) => ({
                //     _id: item._id,
                //     price: item.salePrice,
                //     name: item.productName,
                //     image: item.productImage[0],
                //     quantity: (() => { cartItemQuantities.find(cartItem => 
                //         cartItem.productId.toString() === item._id.toString())
                        
                //         return cartItem ? cartItem.quantity: 0;
                // })()

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
                console.log('order placed by razorpay')
                orderDone = await newOrder.save();
                const generatedOrder = await generatedOrderRazorpay(orderDone._id, orderDone.totalPrice);
                console.log(generatedOrder, "order generated")
                res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: orderDone, orderId: orderDone._id, quantity: cartItemQuantities });
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
        }
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
        console.log(findOrder)

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
        res.redirect('/profile');

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

module.exports = {
                   getCheckoutPage,
                   orderPlaced,
                   getOrderDetailsPage,
                   cancelOrder,
                   getOrderListPageAdmin,
                   getOrderDetailsPageAdmin,
                   changeOrderStatus
                  }