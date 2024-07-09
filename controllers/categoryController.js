const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");

// rendering the category page

const getCategoryInfo = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    res.render("categories", { cat: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryData = await Category.find({});
    const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`), $options: 'i' } });
    if (description) {
      if (!categoryExists) {
        const newCategory = new Category({
          name: name,
          description: description,
        });
        await newCategory.save();
        console.log("New category: ", newCategory);
        res.redirect("/admin/allCategories");
      } else {
        res.render("categories", {message: "Category already exists", cat: categoryData})
      }
    } else {
      console.log("description required");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    res.render("categories", { cat: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};
const getListCategory = async (req, res) => {
  try {
    let id = req.query.id;
    console.log(id);
    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error.message);
  }
};

const getUnlistCategory = async (req, res) => {
  try {
    let id = req.query.id;
    console.log(id);
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error.message);
  }
};

const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("Iam inside getEdit category id is", id);
    const category = await Category.findOne({ _id: id });
    console.log("category", category);
    res.render("edit-category", { category: category });
  } catch (error) {
    console.log(error.message);
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Iam inside editCategory, id from params is", id);
    const { categoryName, description } = req.body;
    const newcategorynamecheck = await Category.findOne({ categoryName: { $regex: new RegExp(`^${categoryName}$`), $options: 'i' } });
    const findCategory = await Category.findOne({ _id: id });
    if (findCategory) {
     if(!newcategorynamecheck){
      await Category.updateOne(
        { _id: id },
        {
          name: categoryName,
          description: description,
        },
      );
      res.redirect("/admin/categories");
     } else {
      console.log("category name already exists")
      res.render("edit-category", {message: "Category already exists",})
     }
    } else {
      console.log("Category not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage)
    const categoryId = req.body.categoryId
    console.log(percentage, categoryId);
    const findCategory = await Category.findOne({_id: categoryId})
    console.log(findCategory);
    
    await Category.updateOne(
      {_id: categoryId},
      {$set: {
        categoryOffer: percentage
      }}
    )
    .then(data=> {
      console.log("categoryOffer added, updated data is ", data)
    })

    const productData = await Product.find({category: findCategory._id })
    console.log(productData);

    for(const product of productData){
      if(product.salePrice){
        product.salePrice =  product.salePrice - Math.floor(product.regularPrice * (percentage/100))
      } else {
        product.salePrice =  product.regularPrice - Math.floor(product.regularPrice * (percentage/100))
      }
      
      await product.save()
    }
    res.json({status: true})
  } catch (error) {
    console.log(error.message)
  }
}

const removeCategoryOffer = async(req, res)=> {
  try {
    const categoryId = req.body.categoryId
  const findCategory = await Category.findOne({_id: categoryId})
  console.log(findCategory);

  const percentage = findCategory.categoryOffer
  //console.log(percentage)

  const productData = await Product.find({category: findCategory._id})

  if(productData.length > 0){
    for(const product of productData){
      product.salePrice = product.salePrice + Math.floor(product.regularPrice * (percentage/100))
      await product.save()
    }
  }

  findCategory.categoryOffer = 0
  await findCategory.save()

  res.json({status: true})

  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  getCategoryInfo,
  addCategory,
  getAllCategories,
  getListCategory,
  getUnlistCategory,
  getEditCategory,
  editCategory,
  addCategoryOffer,
  removeCategoryOffer,
  }
