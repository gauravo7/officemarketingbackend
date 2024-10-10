const Category = require("../category/categoryModel")
const Customer = require("../customer/customerModel")
const Proof = require("../proof/proofModel")
const Task = require("../task/taskModel")
const Transaction = require("../transaction/transactionModel")
const User = require("../user/userModel")





const dashboard = async (req, res) => {
    let totalCategories = await Category.countDocuments({ isDelete: false })
    let totalCustomers = await Customer.countDocuments({ isDelete: false })
    let totalProducts = await Product.countDocuments()
    let totalBookings = await Booking.countDocuments()


    res.send({
        success: true,
        status: 200,
        message: 'Welcome Admin',
        totalCategories: totalCategories,
        totalCustomers: totalCustomers,
        totalProducts: totalProducts,
        totalBookings: totalBookings,
    })

}

module.exports = { dashboard }

