const bcrypt = require("bcryptjs");
const User = require("../models/userSchema");
const nodemailer = require("nodemailer")

//load login page
const getLoginPage = async (req, res) => {
    try {
        if(!req.session.user){
            res.render("login")
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.log(error.message);
    }
}

//load signup page
const getSignupPage = async (req, res) => {
    try {

        if(!req.session.user){
            res.render("signup")
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.log(error.message);
    }
}

//otp generation
function generateOtp() {
    const digits = "0123456789"
    var otp = ""
    for(i = 0; i < 6; i++){
        otp += digits[Math.floor(Math.random() * 10)]
    }
    return otp;
}

//User registration
const signupUser = async (req, res) => {
    try {
        const { email } = req.body
        const findUser = await User.findOne({ email });

        if (req.body.password === req.body.cPassword){
            if(!findUser){
                var otp = generateOtp()
                console.log("heyo am the otp", otp);
                // const newUser = await User.create(req.body);
                // console.log(newUser);
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    host:'smtp.gmail.com',
                    port:587,
                    secure:false,
                    requireTLS: true,
                    auth: {
                      user: process.env.EMAIL_USERNAME,
                      pass: process.env.EMAIL_PASSWORD,
                    }
                  })
                
                  const info = await transporter.sendMail({
                    from: process.env.EMAIL_USERNAME,
                    to: email,
                    subject: "Verfiy your Account",
                    text: `Your OTP is ${otp}`,
                    html: `<b> <h4> Your OTP ${otp}</h4> <br> <a href="">Click here</a></b>`
                  })

                  if(info) {
                    req.session.userOTP = otp
                    req.session.UserData = req.body
                    res.render("verify-otp")
                    console.log("Email sent", info.messageId)
                  } else {
                    res.json("email error")
                  }
            } else {
                console.log("User already exist");
                res.render("signup", {message: "User with this email already exists"})
            }
        } else{
            console.log("the confirm password does not match");
            res.render("signup", {message: "the confirm password does not match"})
        }

    } catch (error) {
        console.log(error.message);
    }
}

//render the OTP verification page
const getOtpPage = async (req, res) => {
    try {
        res.render("verify-otp")
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    getLoginPage, getSignupPage, signupUser
}