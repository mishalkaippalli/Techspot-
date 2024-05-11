const mongoose = require('mongoose');
const { asNumber } = require('pdf-lib');

const addressSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    address: [{
        name: {
            type: String,
            required: true
        },
        mobile: {
            type: Number,
        },
        homeAddress:{
            type:String,
        },
        city:{
            type: String,
        },
        state:{
            type: String,
        },
        postalCode:{
            type: Number,
           
        },
        isDefault:{
            type:Boolean,
            default:false
         }
    }]
})

const address = mongoose.model('address', addressSchema)

module.exports = address;