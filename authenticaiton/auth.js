
const User = require("../models/userSchema");

const isLogged = async (req, res, next) => {
    if (req.session.user) {
        try {
            // console.log("I am inside isLogged middleware req.session is ",req.session);
            const data = await User.findById(req.session.user).lean();
            // console.log("User data:", data);
            //this is for when the admin blocks user then user cannot acces the web app anymore
                if (data && data.isBlocked === true) {
                    try {
                        req.session.destroy((err) =>{
                          if(err) console.log(err.message)
                          
                          console.log("logged out")
                          res.redirect("/login")
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
        User.findOne({isAdmin : "1"})
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

module.exports = {
                   isLogged,
                   isAdmin
                }