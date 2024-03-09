const User = require('../models/userSchema')
const Product = require('../models/productSchema')
const mongodb = require('mongodb')

const getCartPage = async(req, res) => {
    try {
        const id = req.session.User
        console.log("Am inside getcartpage, id is :", id)
        const user = await User.findOne({_id: id})
        const productIds = user.cart.map(item => item.productId)
        console.log(productIds)
        const products = await Product.find({_id: {$in: productIds}})

        const oid = new ObjectId(id)  //to make addobjectid to the id
        console.log(oid)

        const data = await User.aggregate([
           {$match: {_id: oid}},
           {$unwind: '$cart'},
           {$project: {
            proId: {'$toObjectId': '$cart.productId'},
            quantity: '$cart.quantity',
           }},
           {$lookup: {
            from: 'products',
            localField: 'proId',
            foreignField: '_id',
            as: 'productDetails',
           }},
        ])
      console.log("Data =>>", data)

      let quantity = 0

      for (const i of user.cart){
        quantity += i.quantity
      }

      let grandTotal = 0;
      for(let i = 0; i < data.length; i++){
        if(products[i]) {
            grandTotal += data[i].productDetails[0].salePrice * data[i].quantity;
        }
        console.log("grandTotal", grandTotal)
        req.session.grandTotal = grandTotal
      }

      res.render("cart", {user, quantity, data, grandTotal})
            
    } catch (error) {
        console.log(error.message)
    }
}

const addToCart = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id)
        const userId = req.session.user
        const findUser = await User.findById(userId)
        console.log(findUser)
        const product = await Product.findById({_id: id}).lean()  //In Mongoose, the .lean() method is used to return a plain JavaScript object (POJO - Plain Old JavaScript Object) instead of a Mongoose document
        
        if (!product) {
            return res.json({status: "product not found"});
        }
        if(product.quantity > 0){
            const cartIndex = findUser.cart.findIndex(item => item.productId == id)           //findIndex() is a JavaScript array method that returns the index of the first element in the array that satisfies the provided testing function. If no element satisfies the testing function, it returns -1.
            console.log(cartIndex, "cartIndex");                                              //If an item with the specified productId exists in the cart array, findIndex() returns its index. Otherwise, it returns -1, indicating that the item with the given productId is not present in the cart.
            if(cartIndex == -1){
                let quantity = parseInt(req.body.quantity)
                await User.findByIdAndUpdate(userId, {
                    $addToSet: {
                        cart: {
                            productId: id,
                            quantity: quantity,
                        }
                    }
                })
                  .then((data) => res.json({status: true}))
            }
        } else {
            const productInCart = findUser.cart[cartIndex]

            if(productInCart.quantity < product.quanity){
                const newQuantity = parseInt(productInCart.quantity) + parseInt(req.body.quantity)
                await User.updateOne(
                    {_id: userId, "cart.productId": id},
                    {$set: {"cart.$.quantity": newQuantity}}
                );
                res.json({status:true})
            } else {
                res.json({status: "out of stock"})
            }
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
                getCartPage,
                addToCart
                 }