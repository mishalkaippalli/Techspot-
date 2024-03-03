const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Brand = require("../models/brandSchema");
const fs = require("fs");
const path = require("path");

const getProductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });
    res.render("add-product", { cat: category, brand: brand });
  } catch (error) {
    console.log(error.message);
  }
};

const addProducts = async (req, res) => {
  try {
    const products = req.body;

    const productExists = await Product.findOne({
      productName: products.productName,
    });
    if (!productExists) {
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].filename);
        }
      }

      const newProduct = new Product({
        id: Date.now(),
        productName: products.productName,
        description: products.description,
        brand: products.brand,
        category: products.category,
        regularPrice: products.regularPrice,
        salePrice: products.regularPrice,
        createdOn: new Date(),
        quantity: products.quantity,
        ram: products.ram,
        storage: products.storage,
        color: products.color,
        productImage: images,
      });

      await newProduct.save();
      console.log("Iam inside addProducts, new products details", newProduct);
      res.redirect("/admin/addproducts");
    } else {
      res.json("failed");
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getProductAddPage,
  addProducts,
};
