const { default: mongoose } = require('mongoose');
const User = require('../models/userSchema')
const Category = require("../models/categorySchema");
const Product = require('../models/productSchema')
const Address = require('../models/addressSchema');
const Wallet = require('../models/walletSchema')
const Coupon = require('../models/couponSchema')
const mongodb = require('mongodb')
const Cart = require('../models/cartModel');
const CartCountHelper = require('../associates/cartItemsCount');

const getCartPage = async(req,res)=>{
    try {

       const user_id = req.session.user
       let cart = await Cart.findOne({userId:user_id}).populate('products.productId');

       if(!cart){
          cart = new Cart({userId:req.session.user,products:[]});
          await cart.save();
       }
          cart.total = cart.products.reduce((total,product)=>{
             return total + product.total;
          },0);
          // console.log(cart.total)
          const userProducts = cart.products;
          const cartTotal = cart.total;

        //   console.log("inside getcart page products:userProducts", userProducts)
        //   console.log("cart total", cartTotal)

 
          const cartItemsCount = await CartCountHelper.findCartItemsCountFromCart(cart);
          //       res.render("cart", {user, quantity, data, grandTotal})
 
          res.render('carttrial',{products:userProducts,cartTotal,cartItemsCount});
 
    } catch (error) {
       console.log(error.message);
    }
 }

// const getCartPage = async(req, res) => {
//     try {
//         const id = req.session.user
//         console.log("Am inside getcartpage, id is :", id)
//         const user = await User.findOne({_id: id})
//         const productIds = user.cart.map(item => item.productId)
//         console.log(productIds)
//         const products = await Product.find({_id: {$in: productIds}})

//         const oid = new mongodb.ObjectId(id)  //to make addobjectid to the id
//         console.log(oid)

//         const data = await User.aggregate([
//            {$match: {_id: oid}},
//            {$unwind: '$cart'},
//            {$project: {
//             proId: {'$toObjectId': '$cart.productId'},
//             quantity: '$cart.quantity',
//            }},
//            {$lookup: {
//             from: 'products',
//             localField: 'proId',
//             foreignField: '_id',
//             as: 'productDetails',
//            }},
//         ])
//       console.log("Data =>>", data)
//       console.log(data.productDetails)

//       let quantity = 0

//       for (const i of user.cart){
//         quantity += i.quantity
//       }

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

//     let grandTotal = 0;

//   for (let i = 0; i < data.length; i++) {
//     if (data[i].productDetails.length > 0) {
//         const salePrice = data[i].productDetails[0].salePrice;
//         const quantity = data[i].quantity;

//         if (!isNaN(salePrice) && !isNaN(quantity)) {
//             grandTotal += salePrice * quantity;
//         }
//     }
//   }

// console.log("Grand Total:", grandTotal);
// req.session.grandTotal = grandTotal;

//       res.render("cart", {user, quantity, data, grandTotal})
            
//     } catch (error) {
//         console.log(error.message)
//     }
// }

// const addToCart = async (req, res) => {
//     try {
//         const id = req.query.id
//         console.log(id)
//         const userId = req.session.user
//         console.log("user id inside addtocart", userId)
//         const findUser = await User.findById(userId)
//         console.log(findUser)
//         const product = await Product.findById({_id: id}).lean()  //In Mongoose, the .lean() method is used to return a plain JavaScript object (POJO - Plain Old JavaScript Object) instead of a Mongoose document
//         console.log(product)
//         if (!product) {
//             return res.json({status: "product not found"});
//         }
//         if(product.quantity > 0){
//             const cartIndex = await findUser.cart.findIndex(item => item.productId == id)           //findIndex() is a JavaScript array method that returns the index of the first element in the array that satisfies the provided testing function. If no element satisfies the testing function, it returns -1.
//             console.log("cartIndex",cartIndex);                                              //If an item with the specified productId exists in the cart array, findIndex() returns its index. Otherwise, it returns -1, indicating that the item with the given productId is not present in the cart.
//             if(cartIndex == -1){
//                 let quantity = parseInt(req.body.quantity)
//                 await User.findByIdAndUpdate(userId, {
//                     $addToSet: {
//                         cart: {
//                             productId: id,
//                             quantity: quantity,
//                         }
//                     }
//                 })
//                   .then((data) => res.json({status: true}))
//             } else {
//             const productInCart = await findUser.cart[cartIndex]
//              console.log("productincart", productInCart);
//             if(productInCart.quantity < product.quantity){
//                 const newQuantity = parseInt(productInCart.quantity) + parseInt(req.body.quantity)
//                 console.log(newQuantity)
//                 await User.updateOne(
//                     {_id: userId, "cart.productId": id},
//                     {$set: {"cart.$.quantity": newQuantity}}
//                 );
//                 res.json({status:true})
//             } else {
//                 res.json({status: "Out of stock"})
//             }
//           }
//         } else { res.json({status: "Out of stock"})
//         console.log("out of stock ind first if case")
//     }
//     } catch (error) {
//         console.log(error.message)
//     }
// }

const addToCart = async(req,res)=>{
    try {
       const proId = req.query.id;
       console.log("inside add to cart",proId)
       let cart = await Cart.findOne({userId:req.session.user._id}); // Find the user
       // console.log(cart);
 
       if(!cart){
          let newCart = new Cart({userId:req.session.user,products:[]});
          await newCart.save();
          cart = newCart;
       }
       // console.log(cart);
       const product = await Product.findById(proId).lean();
       console.log("products inside addtocart ", product)
       if(product.quantity === 0){
          return res.json({status:'error',message:'Out of stock'})
       }else{
          const existingProductIndex = cart.products.findIndex((product)=>{
             return product.productId.toString() === proId;
          })
          
          if(existingProductIndex === -1){
             const total = product.salePrice;
    
             cart.products.push({
                productId:proId,
                quantity:1,
                total, //Use the Updated total value
             });
          }else{
             if(product.quantity > cart.products[existingProductIndex].quantity){
                cart.products[existingProductIndex].quantity += 1;
                const product = await Product.findById(proId).lean();
                cart.products[existingProductIndex].total += product.salePrice;
             }else{
                return res.json({status:'error',message:'Out of stock'})
             }
              
          }
          // Calculate the updated total amount for the cart
          cart.total = cart.products.reduce((total,product)=>{
             return total + product.total;
          },0);
          // console.log(cart.total);
          
          await cart.save();
          // console.log(cart);
          if(req.session && req.session.user ){
             const cartItemsCount = await CartCountHelper.findCartItemsCountFromCart(cart);
             console.log("cartitemscount", cartItemsCount)
             return res.json({status:'success',cartTotal:cart.total,message:'Added to Cart',cartItemsCount});
          }
          return res.json({status:'success',cartTotal:cart.total,message:'Added to Cart'});
          
       }
       
    } catch (error) {
       console.log(error.message);
    }
 }

 // Remove product from the cart
const removeFromCart = async(req,res)=>{
   try {
      const user_id = req.session.user;
      const productId = req.query.productId;

      const cartInfo = await Cart.findOneAndUpdate({userId:user_id},
         {$pull:{
            products:{productId:productId},
         }},
         {new:true});
      res.json({status:'success',message:'Product Removed'})
   } catch (error) {
      res.json({status:'error',message:'Something went wrong'});
      console.log(error.message);
   }
}

// const changeQuantity = async(req, res) => {
//     try {
//         const id = req.body.productId
//         const user = req.session.user
//         const count = req.body.count

//         const findUser = await User.findOne({_id: user})

//         const findProduct = await Product.findOne({_id: id})

//         if(findUser){
//             const productExistinCart = findUser.cart.find(item => item.productId === id)

//             let newQuantity
//             if(productExistinCart){
//                 console.log(count);
//                 if(count == 1){
//                     newQuantity = productExistinCart.quantity + 1
//                 } else if (count == -1) {
//                     newQuantity = productExistinCart.quantity - 1
//                 } else {
//                     return res.status(400).json({status: false, error: "Invalid count"})
//                 }
//             } else {
//                 console.log("product does not exist in cart")
//             }

//             console.log(newQuantity, 'this id new quantity');
//             if(newQuantity > 0 && newQuantity <= findProduct.quantity){
//                 let quantityUpdated = await User.updateOne(
//                     {_id: user, "cart.productId": id},
//                     {
//                         $set: {
//                             "cart.$.quantity": newQuantity
//                         }
//                     }
//                 )
//                 const totalAmount = findProduct.salePrice
                
//                 if(quantityUpdated){
//                     res.json({status: true, quantityInput: newQuantity, count:count, totalAmount: totalAmount})
//                 } else {
//                     res.json({status:false, error: 'cart quantity is less'})
//                 }
//             } else {
//                 res.json({status: false, error: 'out of stock'})
//             }
//         }
//     } catch (error) {
//         console.log(error.message)
//         return res.status(500).json({status: false, error: "server error"});
//     }
// }

const updateQuantity = async (req, res) => {
    try {
        console.log("inside update quantity req.body is ",req.body)
      //  const findCart = await Cart.findOne({userId:userId});
       const userId = new mongoose.Types.ObjectId(req.session.user._id);
       const productId = new mongoose.Types.ObjectId(req.body.proId) ;
       const count = req.body.count;
       const currentValue = req.body.currentValue;
       // console.log(currentValue)
       // console.log('User ID:', userId);
       // console.log('Product ID:', productId);
       // console.log('Count:', count); 
       // console.log('Cart : ', findCart)
 
       const product = await Product.findById(productId);
       if(product.quantity < currentValue){
          res.json({status:'error',message:'Stock Exceeded'});
       }else{
          const cart = await Cart.findOneAndUpdate(
             { 
                userId: userId,
                'products.productId':productId
             },
             { $inc: 
                { 'products.$.quantity': count }
             },
             { new: true }
          ).populate('products.productId');
    
          // Update total 
          const updateProduct = cart.products.find(product=>product.productId._id.equals(productId))
          updateProduct.total = updateProduct.productId.salePrice * updateProduct.quantity;

          console.log("updated product in cart",updateProduct )
          console.log("updated product in cart total",updateProduct.total )

          await cart.save()
 
          // Finding the cart total items count
          const cartItemsCount = await CartCountHelper.findCartItemsCountFromCart(cart);
          console.log(cartItemsCount)
    
          res.json({ status: 'success',message:'Quantity Updated',cartItemsCount});
       }
       
    } catch (error) {
       console.error('Error:', error.message);
       res.json({ status: 'error' });
    }
 };
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

// Loading the checkout page

const loadCheckOut = async(req,res)=>{
   try {
      const user_id = req.session.user;
      let userAddress = await Address.findOne({userId:user_id}); // Find the user
      let userWallet = await Wallet.findOne({userId:user_id});

      // If user have no wallet then we create one 

      if(!userWallet){
         userWallet = new Wallet({
            userId:user_id,
         })
         await userWallet.save();
      }

      // If no user
      if(!userAddress){
         userAddress = new Address({userId:user_id,address:[]});
         await userAddress.save();
      }
      const coupons = await Coupon.find({isActive:true});
      const cart = await Cart.findOne({userId:user_id}).populate('products.productId'); // Taking the product details
      const cartDetails = cart.products;
      const grandTotal = cart.products.reduce((total,product)=>{
         return total + product.total;
      },0);

      // Taking the available coupons for user with this price range
      const availableCoupons = coupons.filter((coupons)=> coupons.minOrderAmount < grandTotal  );
      console.log(availableCoupons)
      

      const address = userAddress.address;

      const cartItemsCount = await CartCountHelper.findCartItemsCountFromCart(cart)
      res.render('checkoutwilys',{address,cartDetails,grandTotal,coupons:availableCoupons,userWallet,cartItemsCount,user_id});
   } catch (error) {
      console.log(error.message)
   }
}

module.exports = {
                getCartPage,
                addToCart,
                deleteProduct,
                updateQuantity,
                removeFromCart,
                loadCheckOut
                 }