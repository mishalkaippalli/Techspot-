const Wishlist = require('../models/wishlistSchema');
const CartCountHelper = require('../associates/cartItemsCount');

const loadWishlist = async(req,res)=>{
    try {
       const user_id = req.session.user._id;
       let userWishlist = await Wishlist.findOne({userId:user_id}).populate('products.productId');
       console.log("userwishlist",userWishlist)
       if(!userWishlist){
          userWishlist = new Wishlist({userId:user_id,products:[]})
          await userWishlist.save()
       }
       console.log("userWishlist.products",userWishlist.products)
       const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
       res.render('wishlist',{userWishlist:userWishlist.products,cartItemsCount});
    } catch (error) {
       console.log(error.message);
    }
 }

 const addtoWishlist = async(req,res)=>{
    try {
       const user_id = req.session.user._id
       const productId = req.body.productId;
       // console.log(productId);
       // console.log(user_id);
       let userWishlist = await Wishlist.findOne({userId:user_id})
 
       if(!userWishlist){
          userWishlist = new Wishlist({userId:user_id,products:[]})
          await userWishlist.save()
       }
       if(userWishlist){
          const findProduct = userWishlist.products.findIndex(product=>product.productId.toString() === productId);
          // console.log(findProduct)
          if(findProduct === -1){
             userWishlist.products.push({
                productId:productId,
                date:Date.now()
             })
             await userWishlist.save()
             res.json({status:'success',message:'Added to Wishlist'});
          }else{
             res.json({status:'error',message:'Item Already exist in Wishlist'})
          }
       }  
    } catch (error) {
       console.log(error.message);
    }
 }

 const removeFromWishlist = async(req,res)=>{
    try {
       const user_id = req.session.user._id;
       const productId = req.query.productId;
 
       const products = await Wishlist.findOneAndUpdate({userId:user_id},
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

module.exports = {
    loadWishlist,
    addtoWishlist,
    removeFromWishlist
}