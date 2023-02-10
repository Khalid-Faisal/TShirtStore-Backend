const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customErrors');
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const WhereClause = require('../utils/whereClause');

exports.testProduct = BigPromise((req, res) => {
    res.status(200).json({
        success: true,
        greeting: "Hello, This is Test from product!",
    });
});

exports.addProduct = BigPromise(async (req, res, next) => {
    let imageArray = []

    if(!req.files){
        return next(new CustomError('images are required', 401));
    }

    if(req.files){
        for (let index = 0; index < req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(req.files.photos[index].tempFilePath, {
                folder: process.env.PRODUCT_NAME
            });
            imageArray.push({
                id: result.public_id,
                secure_url: result.secure_url,
            });
        }
    }
    req.body.photos = imageArray;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(200).json({
        success: true,
        product
    });
});

exports.getAllProducts = BigPromise(async (req, res, next) => {
    const resultPerPage = 6;
    
    const totalProductCount = await Product.countDocuments();
    
    const productsObj = new WhereClause(Product.find(), req.query).search().filter();
    
    let products = await productsObj.base;

    const filteredProductNumber = products.length;
    
    productsObj.pager(resultPerPage);
    products = await productsObj.base.clone();

    res.status(200).json({
        success: true,
        products,
        filteredProductNumber,
        totalProductCount,
    });

});

exports.getOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError(`Invalid ID ${req.params.id}`, 400));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

exports.addReview = BigPromise(async (req, res, next) => {
    const {rating, comment, productId} = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId);
    const alreadyReviewed = await product.reviews.find(
        (rev)=> rev.user.toString() === req.user._id.toString()
    );

    if(alreadyReviewed){
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        });
    }else{
        product.reviews.push(review);
        product.numberOfReviews = product.reviews.length;
    }

    //Adjust ratings
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save({
        validateBeforeSave: false,
    });

    res.status(200).json({
        success: true,
    });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
    const { productId } = req.query;
    // console.log(`**** ${req.query}`);
    // console.log(`**** ${productId}`);
    const product = await Product.findById(productId);
    if(!product){
        return next(new CustomError(`Invalid ID ${req.params.id}`, 400));
    }

    const reviews = product.reviews.filter(
        (rev)=> rev.user.toString() === req.user._id.toString()
    );

    const numberOfReviews = reviews.length;
    //Adjust ratings
    // console.log(product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length);
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    // console.log(product);
    await Product.findByIdAndUpdate(productId, {
        reviews,
        ratings,
        numberOfReviews
    },{
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

exports.getOnlyReviewForOneProduct = BigPromise(async (req, res, next) => {
    const product =  await Product.findById(req.query.id);
    if(!product){
        return next(new CustomError(`Invalid ID ${req.params.id}`, 400));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews,
    });
});

//Admin Controller

exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    let imageArray = [];
    if(!product){
        return next(new CustomError(`Invalid ID ${req.params.id}`, 401));
    }

    if(req.files){
        //destroy image
        for (let index = 0; index < product.photos.length; index++) {
            const res = await cloudinary.v2.uploader.destroy(product.photos[index].id);
        }
        //add new photos
        for (let index = 0; index < req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(req.files.photos[index].tempFilePath, {
                folder: process.env.PRODUCT_NAME
            });
            imageArray.push({
                id: result.public_id,
                secure_url: result.secure_url,
            });
        }
    }

    req.body.photos = imageArray;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })
    res.status(200).json({
        success: true,
        product,
    });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError(`Invalid ID ${req.params.id}`, 401));
    }

    if(req.files){
        //destroy image
        for (let index = 0; index < product.photos.length; index++) {
            const res = await cloudinary.v2.uploader.destroy(product.photos[index].id);
        }
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: `Product is deleted!`
    });
});