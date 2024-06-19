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

       const user_id = req.session.user._id
       let cart = await Cart.findOne({userId:user_id}).populate('products.productId');
         
       console.log("inside getcartpage", cart)
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
 
          res.render('cart',{products:userProducts,cartTotal,cartItemsCount,user_id});
 
    } catch (error) {
       console.log(error.message);
    }
 }

const addToCart = async(req,res)=>{
    try {
       const proId = req.query.id;
       console.log("inside add to cart",proId)
       let cart = await Cart.findOne({userId:req.session.user._id}); // Find the user
       console.log(cart);
 
       if(!cart){
          let newCart = new Cart({userId:req.session.user._id,products:[]});
          await newCart.save();
          cart = newCart;
       }
       console.log(cart);
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
      console.log("Req.session", req.session)
      console.log("user_id",user_id)
      let userAddress = await Address.findOne({userId:user_id}); // Find the user
      console.log(userAddress)

      // let userAddress2 = await Address.findOne({userId:req.session.user._id}); // Find the user
      // console.log("userAddress2", userAddress2)

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
      console.log("cart details",cartDetails);
      const grandTotal = cart.products.reduce((total,product)=>{
         return total + product.total;
      },0);

      // Taking the available coupons for user with this price range
      const availableCoupons = coupons.filter((coupons)=> coupons.minOrderAmount < grandTotal  );
      // console.log(availableCoupons)
      

      const address = userAddress.address;

      const cartItemsCount = await CartCountHelper.findCartItemsCountFromCart(cart)
      res.render('checkout',{address,cartDetails,grandTotal,coupons:availableCoupons,userWallet,cartItemsCount,user_id});
   } catch (error) {
      console.log(error.message)
   }
}

const loadOrderFailed = async(req,res)=>{
   try {
      const orderId = req.query.orderId;

      const orderDetails = await Order.findById(orderId);
      console.log("inside loadorderfailed", orderDetails)
      res.render('order-failed',{orderDetails});
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
                loadCheckOut,
                loadOrderFailed
                 }