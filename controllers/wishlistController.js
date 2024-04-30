const User = require('../models/userSchema') 
const Product = require('../models/productSchema')

const getWishlistPage = async(req, res) => {
    try {
        const userId = req.session.user
        console.log(userId)
        const findUser = await User.findOne({_id: userId})
        console.log("inside getwishlist page", findUser.wishlist)
        res.render("wishlist", {data: findUser.wishlist, user: userId})
        } catch (error) {
        console.log(error.message)
    }
}

const addToWishlist = async (req, res) => {
    try {
        console.log("inside addtowishlist",req.session.user)
        if(!req.session.user) {
            console.log("User not found")
            res.json({error: "User not found", status: false})
        }
        const productId = req.body.productId
        const findProduct = await Product.findOne({_id: productId})
        console.log(findProduct)

        await User.updateOne(
            {
                _id: req.session.user,
            },
            {
                $addToSet: {
                    wishlist: {                         
                                productId: productId,
                                image: findProduct.productImage[0],
                                productName: findProduct.productName,
                                category: findProduct.category,
                                salePrice: findProduct.salePrice,
                                brand: findProduct.brand,
                                units: findProduct.quantity
                    }
                }   
            }          
        )
        .then(data => console.log("wishlist updated",data))

        res.json({status: true})
    } catch (error) {
        console.log(error.message)
    }
}

const deleteItemWishlist = async (req, res) => {
    try {
        const id = req.query.id
        await User.updateOne(
            {_id: req.session.user },
            {
                $pull: {
                    wishlist: {productId: id}
                }
            }
        )
        .then((data)=> console.log(data))
        res.redirect("/wishlist")
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    getWishlistPage,
    addToWishlist,
    deleteItemWishlist
}