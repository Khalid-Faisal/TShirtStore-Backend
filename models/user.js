const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name!'],
        maxlength: [40, 'name should be under 40 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email!'],
        validate: [validator.isEmail, 'Please enter email in correct format'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be atleast 8 characters'],
        select: false,
    },
    role: {
        type: String,
        default: 'user',
    },
    photo: {
        id: {
            type: String,
            required: true,
        },
        secure_url: {
            type: String,
            required: true,
        },
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    createdAt:{
        type: Date,
        default: Date.now,
    },
});

//encrypt password before save --HOOKS
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
});

//Validate the password with user input password
userSchema.methods.isValidatedPassword = async function(userInputPassword){
    return await bcrypt.compare(userInputPassword, this.password);
};

//create and return jwt token
userSchema.methods.getJwtToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRY});
}

//generate forgot password token
userSchema.methods.getForgotPasswordToken = function() {
    //Generate a long random string
    const forgotToken = crypto.randomBytes(20).toString('hex');

    //Get a hash - make sure you get a hash on backend
    this.forgotPasswordToken = crypto.createHash('sha256').update(forgotToken).digest('hex');

    this.forgotPasswordExpiry = Date.now() + process.env.FORGET_PASSWORD_EXPIRY;
    
    return forgotToken;
}


module.exports = mongoose.model('User', userSchema);