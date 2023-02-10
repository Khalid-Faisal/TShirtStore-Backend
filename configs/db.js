const mongoose = require('mongoose');

const connectWithDb = ()=>{
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(
        console.log(`DATABASE GOT CONNECTED!`)
    ).catch(error => {
        console.log(`DATABASE CONNECTION ISSUE`);
        console.log(error)
        process.exit(1)
    });
};

module.exports = connectWithDb;