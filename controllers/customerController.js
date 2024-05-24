const User = require("../models/userSchema");

const getCustomersInfo = async (req, res) => {
  try {
    const userData = await User.find({
      is_admin : false,
    });

    res.render("customers", {
      data: userData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getCustomerBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    console.log(id);
    await User.updateOne({ _id: id }, { $set: { is_blocked: true } });
    res.redirect("/admin/users");

  } catch (error) {
    console.log(error.message);
  }
};

const getCustomerUnblocked = async (req, res) => {
  try {
    let id = req.query.id;
    console.log(id);
    await User.updateOne({ _id: id }, { $set: { is_blocked: false } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { getCustomersInfo, getCustomerBlocked, getCustomerUnblocked };
