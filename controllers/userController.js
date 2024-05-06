const bcrypt = require("bcryptjs");
const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const Product = require("../models/productSchema");
const Brand = require("../models/brandSchema");
const Category = require("../models/categorySchema");
const { resolveConfig } = require("prettier");
const Coupon = require("../models/couponSchema");

// pagenotfound
const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
  } catch (error) {
    console.log(error.message);
  }
};

// Generate hashed password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("hashed password", passwordHash)
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//Loading the Home page
const getHomePage = async (req, res) => {
  try {
    const today = new Date().toISOString();
    const user = req.session.user;
    console.log("req.session.user inside get home page",user)
    //banner here

    const userData = await User.findOne({_id: user});
    console.log("userdata inside get home page", userData)
    const brandData = await Brand.find({ isBlocked: false });
    const productData = await Product.find({ isBlocked: false })
      .sort({ _id: -1 })
      .limit(4);
       
      // console.log("inside gethomePage productdata is", productData)
    if (user) {
      res.render("home", {
        user: userData,
        data: brandData,
        products: productData,
      });
    } else {
      res.render("home", { products: productData, data: brandData });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load login page
const getLoginPage = async (req, res) => {
  try {
    if (!req.session.user) {
      res.render("login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load signup page
const getSignupPage = async (req, res) => {
  try {
    if (!req.session.user) {
      res.render("signup");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//otp generation
function generateOtp() {
  const digits = "0123456789";
  var otp = "";
  for (i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

//User registration
const signupUser = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email });

    if (req.body.password === req.body.cPassword) {
      if (!findUser) {
        var otp = generateOtp();
        console.log("heyo am the otp", otp);
        // const newUser = await User.create(req.body);
        // console.log(newUser);
        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const info = await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Verfiy your Account",
          text: `Your OTP is ${otp}`,
          html: `<b> <h4> Your OTP ${otp}</h4> <br> <a href="">Click here</a></b>`,
        });

        if (info) {
          req.session.userOtp = otp;
          req.session.userData = req.body;
          res.render("verify-otp", { email });
          console.log("Email sent", info.messageId);
        } else {
          res.json("email error");
        }
      } else {
        console.log("User already exist");
        res.render("signup", {
          message: "User with this email already exists",
        });
      }
    } else {
      console.log("the confirm password does not match");
      res.render("signup", { message: "the confirm password does not match" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//render the OTP verification page
const getOtpPage = async (req, res) => {
  try {
    res.render("verify-otp");
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.userData.email;
    var newOtp = generateOtp();
    console.log(email, newOtp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend OTP",
      text: `Your OTP is ${newOtp}`,
      html: `<b> <h4> Your new OTP is${newOtp}</h4> <br> <a href="">Click here</a></b>`,
    });

    if (info) {
      req.session.userOtp = newOtp;
      res.json({ success: true, message: "OTP resent successfully" });
      console.log("Email resent", info.messageId);
    } else {
      res.json({ success: false, message: "Failed to resend OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "Error in resending OTP" });
  }
};

// Verify otp from email with generated otp and save the user data to db

const verifyOtp = async (req, res) => {
  try {
    console.log("Iam inside verify OTP");
    //get otp from the body
    const { otp } = req.body;
    console.log("Iam otp inside verifyotp", otp);
    console.log(
      "Iam req.session.userOtp inside verifyotp",
      req.session.userOtp,
    );
    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      console.log(user);
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
      });

      await saveUserData.save();

      req.session.user = saveUserData._id;
      res.json({ status: true });
    } else {
      console.log("otp not matching");
      res.json({ status: false });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: "0", email: email });

    console.log("IAm inside userLogin");

    if (findUser) {
      const isUserNotBlocked = findUser.isBlocked === false;

      if (isUserNotBlocked) {
        const passwordmatch = await bcrypt.compare(password, findUser.password);
        if (passwordmatch) {
          req.session.user = findUser._id;
          console.log("loggedin, user details from session", req.session.user);
          console.log("Logged in");
          res.redirect("/");
        } else {
          console.log("Password is not matching");
          res.render("login", { message: "password is not matching" });
        }
      } else {
        console.log("User is blocked by admin");
        res.render("login", { message: "User is blocked by admin" });
      }
    } else {
      console.log("User not found");
      res.render("login", { message: "User is not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.render("login", { message: "Login failed" });
  }
};

const getShopPage = async (req, res) => {
  try {
    const user = req.session.id;
    const products = await Product.find({ isBlocked: false });
  
    const count = await Product.find({ isBlocked: false }).count();
    const brands = await Brand.find({});
    const categories = await Category.find({ isListed: true });
    let itemsPerPage = 6
    let currentPage = parseInt(req.query.page) || 1
    let startIndex = (currentPage -1) * itemsPerPage
    let endIndex = startIndex + itemsPerPage
    let totalPages = Math.ceil(products.length / 6)
    const currentProduct = products.slice(startIndex, endIndex)
    console.log("I am inside getShop page");

    //pagination to be added

    res.render("shop", 
        { 
          user: user,
          product: currentProduct,
          brand: brands,
          category: categories,
          count: count,
          totalPages,
          currentPage, 
        });
  } catch (error) {
    console.log(error.message);
  }
};


const getLogoutUser = async (req, res) =>{
  try {
    req.session.destroy((err) =>{
      if(err) console.log(err.message)
      
      console.log("logged out")
      res.redirect("/login")
    })
  } catch (error) {
    console.log(error.message)
  }
}

const getProductDetailPage = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("Iam inside gettrialfordetailpage page user is", user);
    const id = req.query.id
    console.log(id);
    const findProduct = await Product.findOne({ id: id });
    console.log("Iam inside getproduct details page", findProduct);
    const findCategory = await Category.findOne({ _id: findProduct.category });
    console.log("find category inside getproductdetail page",findCategory);

    // let totalOffer
    // if(findCategory.categoryOffer || findProduct.productOffer){
    //   totalOffer = findCategory.categoryOffer + findProduct.productOffer
    // }

    // console.log("findproduct is", findProduct);
    // console.log("findcategory is", findCategory);

    if (user) {
      res.render("productDetails", { data: findProduct, user: user });
    } else {
      res.render("productDetails", { data: findProduct });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const filterProduct = async(req, res) => {
   try {
    const user = req.session.user;
    const category = req.query.category;
    const brand = req.query.brand;
    const brands = await Brand.find({});
    const findCategory = category ? await Category.findOne({_id: category}) : null;
    console.log("inside filterproduct findcategory is", findCategory)
    const findBrand = brand ? await Brand.findOne({_id: brand}): null;

    const query = {
      isBlocked: false,
    };
    if(findCategory) {
      query.id = findCategory._id;
      console.log("query id", query.id)
    }
   

    if(findBrand){
      query.brand = findBrand.brandName
    }

    const findProducts = await Product.find({category: query.id});
    const categories = await Category.find({isListed: true})

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / 6);
    const currentProduct = findProducts.slice(startIndex, endIndex);

    res.render("shop", {
      user: user,
      product: currentProduct,
      category: categories,
      brand: brands,
      totalPages,
      currentPage,
      selectedCategory: category || null,
      selctedBrand: brand || null,
    });

   } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error")
   }
};

const filterByPrice = async(req, res) => {
  try {
    const user = req.session.user
    const brands = await Brand.find({});
    const categories = await Category.find({isListed: true});
    console.log(req.query);

    const findProducts = await Product.find({
      $and: [
        {salePrice: {$gt: req.query.gt}},
        {salePrice: {$lt: req.query.lt}},
        {isBlocked: false}
      ]
    })

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / 6);
    const currentProduct = findProducts.slice(startIndex, endIndex);

    res.render("shop", {
      user: user,
      product: currentProduct,
      category: categories,
      brand: brands,
      totalPages,
      currentPage
    })
  } catch (error) {
    console.log(error.message)
  }
}

const getSortProducts = async (req, res) => {
  try {
    console.log("Iam inside getsortproducts in userController")
    console.log(req.body)
    let option = req.body.option;
    let itemsPerPage = 6;
    let currentPage = parseInt(req.body.page) || 1
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let data;

    if(option == "highToLow"){
      data = await Product.find({isBlocked: false}).sort({salePrice: -1});
    } else if (option == "lowToHigh"){
      data = await Product.find({isBlocked: false}).sort({salePrice: 1});
    } else if (option == "realeseDate") {
      data = await Product.find({isBlocked: false}).sort({createdOn: 1});
    }
    
    
    res.json({
      status: true,
      data: {
        currentProduct: data,
        count: data.length,
        totalPages: Math.ceil(data.length / itemsPerPage),
        currentPage
      }
    });

  } catch (error) {
    console.log(error.message);
    res.json({status: false, error: error.message})
  }
}

const searchProducts = async(req, res) => {
  try {
      const user = req.session.user
      let search = req.query.search
      const brands = await Brand.find({})
      const categories = await Category.find({isListed: true})

      const searchResult = await Product.find({
        $or:[
          {
            productName: {$regex: ".*" + search + ".*", $options: "i"},
          }
        ],
        isBlocked: false
      }).lean()  //.lean(): This is a Mongoose method used to return plain JavaScript objects instead of Mongoose documents.
      
      let itemsPerPage = 6
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(searchResult.length / 6)
      let currentProduct = searchResult.slice(startIndex, endIndex)
       
      res.render("shop",
        {
          user: user,
          product: currentProduct,
          category: categories,
          brand: brands,
          totalPages,
          currentPage
        })
    } catch (error) {
    console.log(error.message)
  }
}


module.exports = {
  getLoginPage,
  getSignupPage,
  signupUser,
  getOtpPage,
  resendOtp,
  verifyOtp,
  pageNotFound,
  userLogin,
  getHomePage,
  getShopPage,
  getProductDetailPage,
  getLogoutUser,
  filterProduct,
  filterByPrice,
  getSortProducts,
  searchProducts,
};
