const BigPromise = require('../middlewares/bigPromise');

exports.home = BigPromise((req, res) => {
    res.status(200).json({
        success: true,
        greeting: "Hello From API",
    });
});

exports.dummyHome = BigPromise((req, res) => {
    res.status(200).json({
        success: true,
        greeting: "Hello, This is Test GET reuest!",
    });
});