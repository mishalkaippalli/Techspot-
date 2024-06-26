const Brand = require("../models/brandSchema");
const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");

const getBrandPage = async (req, res) => {
  try {
    const brands = await Brand.find({});
    res.render("brands", { data: brands });
  } catch (error) {
    console.log(error.message);
  }
};

const addBrand = async (req, res) => {
  try {
    const { name } = req.body;
    console.log(name);
    const brand = req.body.name;
    const findBrand = await Brand.findOne({ brand });
    if (!findBrand) {
      const image = req.file.filename;
      const newBrand = new Brand({
        brandName: brand,
        brandImage: image,
      });

      await newBrand.save();
      res.redirect("/admin/brands");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getAllBrands = async (req, res) => {
  try {
    res.redirect("/admin/brands");
  } catch (error) {
    console.log(error.message);
  }
};

const blockBrand = async (req, res) => {
  try {
    const id = req.query.id;
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
    console.log("brand blocked");
    res.redirect("/admin/brands");
  } catch (error) {
    console.log(error.message);
  }
};

const unBlockBrand = async (req, res) => {
  try {
    const id = req.query.id;
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
    console.log("brand unblocked");
    res.redirect("/admin/brands");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getBrandPage,
  addBrand,
  getAllBrands,
  blockBrand,
  unBlockBrand,
};
