const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customErrors');
const cookieToken = require('../utils/cookieToken');
const mailHelper = require('../utils/emailHelper');
const cloudinary = require('cloudinary');
const crypto = require('crypto');


exports.signup = BigPromise(async (req, res, next) => {
    let result;

    if(req.files){
        let file = req.files.photo;
        result = await cloudinary.v2.uploader.upload(file.tempFilePath , {
            folder: "users",
            width: 150,
            crop: "scale",
        });
    }

    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return next(new CustomError('name, email and password are required!', 400));
    }

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url,
        },
    });
    cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
    const {email, password} = req.body;

    if(!email && !password){
        return next(new CustomError('Please provide email and password', 400));
    }
    //We have to include password also
    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new CustomError('User is not present, Please signup first', 404));
    }

    const isPasswordCorrect = await user.isValidatedPassword(password);
    if(!isPasswordCorrect){
        return next(new CustomError('Password does\'t match!', 400));
    }
    cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logout Successful!"
    })
});

exports.forgotpassword = BigPromise(async (req, res, next) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user){
        return next(new CustomError('User not found!', 404));
    }

    const forgotToken = user.getForgotPasswordToken();

    await user.save({validateBeforeSave: false});

    const myurl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;

    const message = `Copy and paste mentioned URL and hit enter \n\n${myurl}`;

    try {
        await mailHelper({
            email: user.email,
            subject: "Password Reset: T-Shirt Store",
            message
        });

        res.status(200).json({
            success: true,
            message: "Email Sent Successfully!"
        })
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({validateBeforeSave: false});

        return next(new CustomError(error.message, 500));
    }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;

    const encryToken = crypto.createHash('sha256').update(token).digest('hex');
    // console.log(encryToken);
    const user = await User.findOne({
        forgotPasswordToken: encryToken,
        forgotPasswordExpiry: {$gt: Date.now()} 
    });
    console.log(user);
    if(!user){
        return next(new CustomError('Token is invalid or expired', 400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new CustomError('Password and Confirm Password do not match', 400));
    }

    user.password = req.body.password;

    user.forgotPasswordToken= undefined;
    user.forgotPasswordExpiry= undefined;
    await user.save();

    //Send cookie token or Send JSON
    cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});

exports.changePassword = BigPromise(async (req, res, next) => {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("+password");

    const isCorrectPassword = user.isValidatedPassword(req.body.oldPassword);

    if(!isCorrectPassword){
        return next(new CustomError('Old password is incorrect',400));
    }

    user.password = req.body.password;

    await user.save();

    cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
    const {email, name} = req.body;
    if(!email && !name){
        return next(new CustomError('Name and email is compulsory', 400));
    }

    const newData = {
        name: req.body.name,
        email: req.body.email,
    };

    if(req.files !== ''){
        const user = await User.findById(req.user.id);
        const imageId = user.photo.id;
        const resp = cloudinary.v2.uploader.destroy(imageId);

        result = await cloudinary.v2.uploader.upload(req.files.photo.tempFilePath , {
            folder: "users",
            width: 150,
            crop: "scale",
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url,
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    
    res.status(200).json({
        success: true,

    });
});

exports.adminAllUsers = BigPromise(async (req, res, next) => {
    const users = await User.find({});
    res.status(200).json({
        success: true,
        users
    });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    
    if(!user){
        return next(new CustomError('No such user found!', 401));
    }
    
    res.status(200).json({
        success: true,
        user
    });
});

exports.adminUpdateOneUserDetail = BigPromise(async (req, res, next) => {
    const {email, name} = req.body;
    if(!email && !name){
        return next(new CustomError('Name and email is compulsory', 400));
    }

    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    if(req.files){
        const user = await User.findById(req.user.id);
        const imageId = user.photo.id;
        const resp = cloudinary.v2.uploader.destroy(imageId);

        result = await cloudinary.v2.uploader.upload(req.files.photo.tempFilePath , {
            folder: "users",
            width: 150,
            crop: "scale",
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url,
        }
    }
    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    
    res.status(200).json({
        success: true,
        user
    });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new CustomError('No Such user found!', 401));
    }

    const imageId = user.photo.id;
    const resp = await cloudinary.v2.uploader.destroy(imageId);

    await user.remove();
    
    res.status(200).json({
        success: true,
    });
});

exports.managerAllUsers = BigPromise(async (req, res, next) => {
    const users = await User.find({role: 'user'});
    res.status(200).json({
        success: true,
        users
    });
});