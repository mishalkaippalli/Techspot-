const mongoose = require("mongoose")

// Declare the Schema of the Mongo model
var brandSchema = new mongoose.Schema({
    brandName:{
        type:String,
        required:true,
        unique:true,
    },
    brandImage:{
        type:Array,
        required:true,
    },
    isBlocked:{
        type:Boolean,
        default: false,
    } 
});

//Export the model
const Brand = mongoose.model('Brand', brandSchema)

module.exports = Brand