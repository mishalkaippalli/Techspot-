
const User = require("../models/userSchema");

const isLogged = async (req, res, next) => {
    if (req.session.user) {
        try {
            const data = await User.findById(req.session.user).lean();
                if (data && data.is_blocked === true) {
                    try {
                        req.session.destroy((err) =>{
                          if(err) res.redirect("/login")
                        })
                      } catch (error) {
                        console.log(error.message)
                      }
                     
                } else {
                    next();
                }
         
        } catch (error) {
            console.error("Error occurred:", error);
            res.redirect("/login");
        }
    } else {
        res.redirect("/login");
    }
};

const isAdmin = (req, res, next) => {
    if(req.session.admin){
        User.findOne({is_admin : true})
        .then((data) => {
            if(data) {
              next();
            } else {
              res.redirect("/admin/login");
            }
        })
        .catch((error) => {
            console.error("Error in is Admin middleware: ", error);
            res.status(500).send("Internal server error")
        })
    } else {
        res.redirect("/admin/login")
    }
}

const isLogout = async(req,res,next)=>{
    try {
       if(req.session.user){
          res.redirect('/home')
       }else{
          next();
       }
    } catch (error) {
       console.log(error.message)
    }
 }

module.exports = {
                   isLogged,
                   isAdmin,
                   isLogout
                }