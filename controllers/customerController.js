const User = require("../models/userSchema")

const getCustomersInfo = async (req, res) => {
    try {
        const userData = await User.find({
            isAdmin: "0"
        }).limit(5)

        res.render("customers", {
            data: userData
        })
    } catch (error) {
        console.log(error.message)
    }
}