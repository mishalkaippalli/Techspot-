const Brand = require("../models/brandSchema")
const Product = require("../models/productSchema")

const getBrandPage = async (req, res) => {
    try {
        
        res.render("brands")
    } catch (error) {
        console.log(error.message);
    }
}

const addBrand = async (req, res) => {
    try {
        const {name} = req.body
        console.log(name)
        const brand = req.body.name
        console.log(req.body);
        const findBrand = await Brand.findOne({brand})
        if(!findBrand){
          const image = req.file.filename
          const newBrand = new Brand({
            brandName : brand,
            brandImage : image
          })

          await newBrand.save()
          res.redirect("/admin/brands")
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    getBrandPage,
    addBrand
}