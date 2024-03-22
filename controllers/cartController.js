const User = require('../models/userSchema')
const Product = require('../models/productSchema')
const mongodb = require('mongodb')

const getCartPage = async(req, res) => {
    try {
        const id = req.session.user
        console.log("Am inside getcartpage, id is :", id)
        const user = await User.findOne({_id: id})
        const productIds = user.cart.map(item => item.productId)
        console.log(productIds)
        const products = await Product.find({_id: {$in: productIds}})

        const oid = new mongodb.ObjectId(id)  //to make addobjectid to the id
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
      console.log(data.productDetails)

      let quantity = 0

      for (const i of user.cart){
        quantity += i.quantity
      }

    //   let grandTotal = 0;
    //   for(let i = 0; i < data.length; i++){
    //     if(products[i]) {
    //         console.log(data[i].productDetails[0].salePrice)
    //         console.log(data[i].quantity)
    //         grandTotal += data[i].productDetails[0].salePrice * data[i].quantity;
    //         console.log(grandTotal);
    //     }
    //     console.log("Am inside grandtotal in getcartpage in cartcontroller.js , grandTotal is", grandTotal)
    //     req.session.grandTotal = grandTotal
    //   }

    let grandTotal = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i].productDetails.length > 0) {
        const salePrice = data[i].productDetails[0].salePrice;
        const quantity = data[i].quantity;

        if (!isNaN(salePrice) && !isNaN(quantity)) {
            grandTotal += salePrice * quantity;
        }
    }
  }

console.log("Grand Total:", grandTotal);
req.session.grandTotal = grandTotal;

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
        console.log(product)
        if (!product) {
            return res.json({status: "product not found"});
        }
        if(product.quantity > 0){
            const cartIndex = await findUser.cart.findIndex(item => item.productId == id)           //findIndex() is a JavaScript array method that returns the index of the first element in the array that satisfies the provided testing function. If no element satisfies the testing function, it returns -1.
            console.log("cartIndex",cartIndex);                                              //If an item with the specified productId exists in the cart array, findIndex() returns its index. Otherwise, it returns -1, indicating that the item with the given productId is not present in the cart.
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
            } else {
            const productInCart = await findUser.cart[cartIndex]
             console.log("productincart", productInCart);
            if(productInCart.quantity < product.quantity){
                const newQuantity = parseInt(productInCart.quantity) + parseInt(req.body.quantity)
                console.log(newQuantity)
                await User.updateOne(
                    {_id: userId, "cart.productId": id},
                    {$set: {"cart.$.quantity": newQuantity}}
                );
                res.json({status:true})
            } else {
                res.json({status: "out of stock"})
            }
          }
        } else { res.json({status: "out of stock"})
    }
    } catch (error) {
        console.log(error.message)
    }
}

const changeQuantity = async(req, res) => {
    try {
        const id = req.body.productId
        const user = req.session.user
        const count = req.body.count

        const findUser = await User.findOne({_id: user})

        const findProduct = await Product.findOne({_id: id})

        if(findUser){
            const productExistinCart = findUser.cart.find(item => item.productId === id)

            let newQuantity
            if(productExistinCart){
                console.log(count);
                if(count == 1){
                    newQuantity = productExistinCart.quantity + 1
                } else if (count == -1) {
                    newQuantity = productExistinCart.quantity - 1
                } else {
                    return res.status(400).json({status: false, error: "Invalid count"})
                }
            } else {
                console.log("product does not exist in cart")
            }

            console.log(newQuantity, 'this id new quantity');
            if(newQuantity > 0 && newQuantity <= findProduct.quantity){
                let quantityUpdated = await User.updateOne(
                    {_id: user, "cart.productId": id},
                    {
                        $set: {
                            "cart.$.quantity": newQuantity
                        }
                    }
                )
                const totalAmount = findProduct.salePrice
                
                if(quantityUpdated){
                    res.json({status: true, quantityInput: newQuantity, count:count, totalAmount: totalAmount})
                } else {
                    res.json({status:false, error: 'cart quantity is less'})
                }
            } else {
                res.json({status: false, error: 'out of stock'})
            }
        }
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({status: false, error: "server error"});
    }
}

const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id, "id");
        const userId = req.session.user
        const user = await User.findById(userId)
        const cartIndex = user.cart.findIndex(item => item.productId == id)
        user.cart.splice(cartIndex, 1)
        await user.save()
        console.log("item deleted from cart");
        res.redirect("/cart")
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
                getCartPage,
                addToCart,
                changeQuantity,
                deleteProduct
                 }