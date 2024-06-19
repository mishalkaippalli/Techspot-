const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");
const Brand = require("../models/brandSchema");
const fs = require("fs");
const path = require("path");

const getProductAddPage = async (req, res) => {
  try {
    const errorfrommulter = req.query.error
    if(errorfrommulter){
      console.log("errorfrommulter is", errorfrommulter)
      const category = await Category.find({ isListed: true });
      const brand = await Brand.find({ isBlocked: false });
      res.render("add-product", { cat: category, brand: brand , error: errorfrommulter});
    } else {
      const category = await Category.find({ isListed: true });
      const brand = await Brand.find({ isBlocked: false });
      res.render("add-product", { cat: category, brand: brand });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addProducts = async (req, res) => {
  try {
    console.log("IAm inside addProducts")
    const products = req.body;
    console.log("Iam inside addproducts, product body fromejs file is ", products)
    const {category} = req.body.category
    const findCategory = await Category.findOne({category: category});
    const categoryId = findCategory._id
    console.log(categoryId)
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
        category: categoryId,
        regularPrice: products.regularPrice,
        salePrice: products.salePrice,
        createdOn: new Date(),
        quantity: products.quantity,
        operatingSystem: products.operatingSystem,
        storage: products.storage,
        color: products.color,
        productImage: images,
      });

      await newProduct.save();
      console.log("Iam inside addProducts, new products details", newProduct);
      res.redirect("/admin/products");
    } else {
      res.json("failed");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getEditProduct = async(req, res) => {
  try {
    const id = req.query.id
    const findProduct = await Product.findOne({_id: id})
     
    if (!findProduct) {
      // If product is not found, render an error page or redirect to a relevant page
      return res.status(404).render("error", { message: "Product not found" });
    }
    
    const category = await Category.find({})
    const findBrand = await Brand.find({})

    const productcategory = await Category.find({_id: findProduct.category})
    const productCategoryName = productcategory[0].name;
    console.log("inside get edit product", productcategory);
    console.log("productCategoryName", productCategoryName);
    res.render("edit-product", {product: findProduct, cat: category, brand: findBrand,
                                  categoryOfProduct: productCategoryName})
  } catch (error) {
    console.log(error.message)
  }
}

const getAllProducts = async(req, res) => {
  try {
    const search = req.query.search || ""
    const page = req.query.search || 1
    const limit = 10
    const productData = await Product.find({
        $or : [
          {productName: {$regex: new RegExp(".*"+ search + ".*", "i") } }, //".*": This is a regular expression pattern that matches any sequence of characters.
          {brand: {$regex: new RegExp(".*" + search + ".*", "i") } }
        ],   
    }).sort({cratedOn: -1})
      .limit(limit*1)
      .skip((page - 1)* limit) // to skip based on the current page number and the limit
      .exec()  // used with await to wait for the query to finish executing before proceeding further in the code

      const count = await Product.find({
        $or: [
          {productName: {$regex: new RegExp(".*"+ search + ".*", "i") } }, //".*": This is a regular expression pattern that matches any sequence of characters.
          {brand: {$regex: new RegExp(".*" + search + ".*", "i") } }
        ]
      }).countDocuments()

      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      })

  } catch (error) {
    console.log(error.message)
  }
}

const deleteSingleImage = async (req, res) => {
  try {
    console.log("I am in deletesingleImage in productController.js")
    console.log(req.body.productId)
    const id = (req.body.productId)
    const image = req.body.filename
    console.log(id, image)
    const product = await Product.findByIdAndUpdate(id, {
      $pull: {productImage: image}
    })

    const imagePath = path.join('public', 'uploads', 'product-images', image);
    if(fs.existsSync(imagePath)){
      await fs.unlinkSync(imagePath);
      console.log(`Image ${image} deleted successfully`);
      res.json({success: true})
    } else {
      console.log(`Image ${image} not found`)
    }
  } catch (error) {
    console.log(error.message)
  }
}

const editProduct = async(req, res) => {
  try {
    const id = req.params.id
    console.log(req.body);
    const data = req.body
    console.log("inside editProduct req body is", data)
    const images = []
    if(req.files && req.files.length > 0){
      for(let i = 0; i < req.files.length; i++){
        images.push(req.files[i].filename)
      }
    }
    console.log("I am inside post editproduct in producontroler, the files i recieved is ", req.files)
       
     const categoryId = req.body.categoryId
    // const findCategory = await Category.findOne({category: category});
    //   const categoryId = findCategory._id
    console.log("categoryid inside edit product",{categoryId})
    if(req.files.length > 0){
      console.log("Yes image is there")
      const updatedProduct = await Product.findByIdAndUpdate(id, {
         id: Date.now(),
         productName: data.productName,
         description: data.description,
         brand: data.brand,
         category: categoryId,
         regularPrice: data.regularPrice,
         quantity: data.quantity,
         operatingSystem: data.operatingSystem,
         storage: data.storage,
         color: data.color,
         createdOn: new Date(),
         productImage: images
      }, { new: true })
      console.log("product updated");
      res.redirect("/admin/products")
    } else {
      console.log("No images found");

      const updatedProduct = await Product.findByIdAndUpdate(id, {
        id: Date.now(),
        productName: data.productName,
        description: data.description,
        brand: data.brand,
        category: categoryId,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        operatingSystem: data.operatingSystem,
        storage: data.storage,
        color: data.color,
        createdOn: new Date(),
     }, { new: true })
     console.log("product updated");
     res.redirect("/admin/products")
    }

  } catch (error) {
    console.log(error.message)
  }
}

const getBlockProduct = async (req, res) => {
  try {
     let id = req.query.id
     await Product.updateOne({_id: id}, {$set: {isBlocked: true}})
     console.log("product blocked")
     res.redirect("/admin/products")
  } catch (error) {
    console.log(error.message)
  }
}

const getUnblockProduct = async(req, res) => {
  try {
     let id = req.query.id
     await Product.updateOne({_id: id},{$set: {isBlocked: false}})
     console.log("product unblocked")
     res.redirect("/admin/products")
  } catch (error) {
    console.log(error.message)
  }
}

const addProductOffer = async (req, res) => {
  try {
    const {productId, percentage} = req.body
    const findProduct = await Product.findOne({_id: productId})
    console.log(findProduct)

    findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (percentage / 100))
    findProduct.productOffer = parseInt(percentage)
    await findProduct.save()

    res.json({status: true})
  } catch (error) {
    console.log(error.message)
  }
}

const removeProductOffer = async(req, res) => {
  try {
    const {productId} = req.body
    const findProduct = await Product.findOne({_id: productId})
    console.log(findProduct);

    const percentage = findProduct.productOffer
    findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100))
    findProduct.productOffer = 0;
    await findProduct.save()
    res.json({status: true})
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  getProductAddPage,
  addProducts,
  getAllProducts,
  getEditProduct,
  editProduct,
  deleteSingleImage,
  getBlockProduct,
  getUnblockProduct,
  addProductOffer,
  removeProductOffer
};
