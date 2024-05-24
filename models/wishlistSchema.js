const mongoose = require('mongoose');

const wishlistModel = new mongoose.Schema({
   userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
      required:true
   },
   
   products:[{
      productId:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'Product'
      },
      date:{
         type:Date,
         default:Date.now()
      }
   }
   ]
})

module.exports = mongoose.model('Wishlist',wishlistModel);