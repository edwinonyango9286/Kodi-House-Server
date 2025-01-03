const mongoose = require('mongoose');


const applicationSchema = new mongoose.Schema({

    unitName:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    user:{
        type:String,
        required:true,
        unique:true,
    },
    status: {
        type: String,
        required: true,
        enum: ["Active", "Inactive"],
    }
});


module.exports = mongoose.model("Application", applicationSchema);