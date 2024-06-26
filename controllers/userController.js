const bcrypt = require("bcryptjs");
const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const pass = require('../associates/securePass');
const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");
const Brand = require("../models/brandSchema");
const { resolveConfig } = require("prettier");
const Coupon = require("../models/couponSchema");
const Wallet = require('../models/walletSchema');
const CartCountHelper = require('../associates/cartItemsCount');
const { error } = require("pdf-lib");
const RazorPayHelper = require("../associates/razorpayHelper")

// pagenotfound
const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
  } catch (error) {
    console.log(error.message);
  }
};

// Loading the Home page
const getHomePage = async (req, res) => {
  try {
    const today = new Date().toISOString();
    const user = req.session.user;
    const userData = await User.findOne({_id: user});
    const brandData = await Brand.find({ isBlocked: false });
    const productData = await Product.find({ isBlocked: false })
      .sort({ _id: -1 })
      .limit(12);
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

// Rendering the login page for user

const loadLogin = async(req, res)=>{
  try {
     res.render('login');
  } catch (error) {
     console.log(error.message)
  }
}

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

function generateOtp() {
  const digits = "0123456789";
  var otp = "";
  for (i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

const insertUser = async(req,res)=>{
   const email = req.body.email
   const userData = req.body;
  try{
     const existingEmail = await User.findOne({email:req.body.email});
     const existingMobile = await User.findOne({mobile:req.body.mobile});
     if(existingEmail && existingMobile){
        res.json({status:'error',message:'Email and Mobile already Exists'})
     }
     else if(existingEmail){
        res.json({status:'error',message:"Email Already Exists"});
     }
     else if(existingMobile){
        res.json({status:'error',message:"Mobile Number Already Exists"});
     }
     else{
      var otp = generateOtp();
              console.log("heyo am the otp", otp);
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
                req.session.user = userData;
                 console.log("Email sent", info.messageId);
                res.json({status:'success',message:'Registered Please Enter your OTP'})
               }
               else {
                res.json({ status: 'error', message: 'Failed to send OTP' });
              }
     }

      } catch(error) {
        console.error(error);
     res.json({status:'error',message:'All Feilds are required'})
  }
}

////---------------googler auth=----------------

const googleAuth = async (req,res)=>{

  try {
      console.log('Google authentication successful.');
       console.log('User:', req.user);
      const findUser = await User.findOne({ email: req.user.email });
      if (findUser) {
          req.session.user = findUser._id
           
      }else{
              const user = req.user
              const saveUserData = new User({
              firstName: user.given_name,
              lastName: user.family_name,
              email: user.email,
              password:user.sub,
              isGoogle:true
          });

          await saveUserData.save();
          console.log("Saveuserdata is", saveUserData)
          req.session.user = saveUserData   
      }
    
      res.redirect('/')
      
  } catch (error) {
      console.log('error hapened in the google login route ',error);
  }

}

// when the user click in register button it will gives a page for entering the otp

const loadVerifiyOTP = async(req,res)=>{
  try {
     res.render('verifyotp')   
  } catch (error) {
     console.log(error.message)
  }
}


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

const verifyotp = async(req,res)=>{
  const otp = req.body.otp;
  const userData = req.session.user
  console.log("req.body.otp", otp)
  try {
    console.log("user session", req.session)
      if (otp === req.session.userOtp){
        console.log("otp verified")
        console.log("userdata", userData)
        const spassword = await pass.securePassword(req.session.user.password);
        console.log(spassword)
        const user = await User.create({
           firstName:userData.firstName,
           lastName:userData.lastName,
           email:userData.email,
           password:spassword,
           mobile:userData.mobile,
        })
        console.log("user", user)

        const userInfo = await user.save(); 
        console.log("otp verifies and userdata saved")
        if(userInfo){
          req.session.user = user;
           res.json({status:'success',message:'OTP Verified Please Login'});
        }
     }else{
      console.log(error.message)
        res.json({status:'error',message:'Please verify your otp'});
     }
  } catch (error) {
    console.log(error.message)
     res.json({status:'error',message:'Please verify your otp'});
  }
}

const verifyUser = async(req,res)=>{
  try {
     const {email , password} = req.body;
     const userData = await User.findOne({email:email});
     if(userData){
        const isMatch = await pass.checkPassword(password,userData.password);
        if(isMatch){
           if(userData.is_blocked === true){
              res.json({status:'error',message:'You are blocked by user please contact with authority'})
           }else{
              req.session.user = userData;
              res.json({status : "success", message:'login successfull'})
           }
        }else{
           res.json({status : "error", message:'Email or password is incorrect'})
        }
     }else{
        res.json({status : "error", message:'Email or password is incorrect'})
     }
  } catch (error) {
     res.json({status : "error", message: error.message})
  }
}

const getShopPage = async (req, res) => {
  try {
    const user = req.session.id;
    let search = req.query.search || '';
    console.log("inside shop req.session is ", req.session)
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

    res.render("shop", 
        { 
          user: user,
          product: currentProduct,
          brand: brands,
          category: categories,
          count: count,
          totalPages,
          currentPage,
          search,
          selectedCategory: null,
        selectedBrand: null
        });
  } catch (error) {
    console.log(error.message);
  }
};

const getLogoutUser = async (req, res) =>{
  try {
    console.log("inside getlogout  user")
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
    const findProduct = await Product.findById(id);
    console.log("Iam inside getproduct details page", findProduct);
    const findCategory = await Category.findOne({ _id: findProduct.category });
    console.log("find category inside getproductdetail page",findCategory);
    if (user) {
      res.render("productDetails", { data: findProduct, user: user });
    } else {
      res.render("productDetails", { data: findProduct });
    }
  } catch (error) {
    console.log(error.message);
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

    let itemsPerPage = 9;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / 9);
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

const searchAndFilterProducts = async (req, res) => {
  try {
    console.log("iam inside searchand filter products")
    const user = req.session.user;
    let search = req.query.search || '';
    const category = req.query.category;
    const brand = req.query.brand;
    
    const brands = await Brand.find({});
    const categories = await Category.find({ isListed: true });

    const query = {
      isBlocked: false,
      productName: { $regex: ".*" + search + ".*", $options: "i" }
    };

    if (category) {
      const findCategory = await Category.findOne({ _id: category });
      if (findCategory) {
        query.category = findCategory._id;
      }
    }

    if (brand) {
      const findBrand = await Brand.findOne({ _id: brand });
      if (findBrand) {
        query.brand = findBrand.brandName;
      }
    }

    const searchResult = await Product.find(query).lean();
    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(searchResult.length / itemsPerPage);
    let currentProduct = searchResult.slice(startIndex, endIndex);

    res.render("shop", {
      user: user,
      product: currentProduct,
      category: categories,
      brand: brands,
      totalPages,
      currentPage,
      search,
      selectedCategory: category || null,
      selectedBrand: brand || null
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

// const searchProducts = async(req, res) => {
//   try {
//       const user = req.session.user
//       let search = req.query.search
//       const brands = await Brand.find({})
//       const categories = await Category.find({isListed: true})

//       const searchResult = await Product.find({
//         $or:[
//           {
//             productName: {$regex: ".*" + search + ".*", $options: "i"},
//           }
//         ],
//         isBlocked: false
//       }).lean()  //.lean(): This is a Mongoose method used to return plain JavaScript objects instead of Mongoose documents.
      
//       let itemsPerPage = 6
//       let currentPage = parseInt(req.query.page) || 1
//       let startIndex = (currentPage - 1) * itemsPerPage
//       let endIndex = startIndex + itemsPerPage
//       let totalPages = Math.ceil(searchResult.length / 6)
//       let currentProduct = searchResult.slice(startIndex, endIndex)
       
//       res.render("shop",
//         {
//           user: user,
//           product: currentProduct,
//           category: categories,
//           brand: brands,
//           totalPages,
//           currentPage,
//           search
//         })
//     } catch (error) {
//     console.log(error.message)
//   }
// }

//------------------------------------Wallet management-----------------

// Load the wallet page
const loadWallet = async(req,res)=>{
  try {
     const user_id = req.session.user;
     // Taking the wallet details from db
     let userWallet = await Wallet.findOne({userId:user_id});
     if(!userWallet){
        userWallet = new Wallet({userId:user_id});
        await userWallet.save();
     }
     const cartItemsCount = await CartCountHelper.findCartItemsCount(user_id);
     res.render('view-wallet',{userWallet,cartItemsCount});
  } catch (error) {
     console.log(error.message);
  }
}

// Recharge the wallet
const rechargeWallet  = async(req,res)=>{
  try{
     let { amount } = (req.body);
     amount = Number(amount);
     const orderId = ""+Date.now();

     RazorPayHelper.generateRazorPay(orderId,amount).then((response)=>{
      console.log("response from razorpay generator", response)
        res.json({status:'RAZORPAY',response})
     })
     
  }catch(error){
     console.log(error.message);
  }
}

module.exports = {
  loadLogin,
  getSignupPage,
  insertUser,
  loadVerifiyOTP,
  resendOtp,
  verifyotp,
  googleAuth,
  pageNotFound,
  verifyUser,
  getHomePage,
  getShopPage,
  getProductDetailPage,
  getLogoutUser,
  // filterProduct,
  filterByPrice,
  getSortProducts,
  // searchProducts,
  loadWallet,
  rechargeWallet,
  searchAndFilterProducts
};
