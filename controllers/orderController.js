const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const mongodb = require("mongodb")

const getCheckoutPage = async(req, res) => {
    try {
        console.log("I am inside getcheckoutpage in usercontroller, request query is", req.query);
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

module.exports = {
                   getCheckoutPage
                  }