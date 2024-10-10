const Category = require("../category/categoryModel")
const Customer = require("../customer/customerModel")
const Proof = require("../proof/proofModel")
const Task = require("../task/taskModel")
const Transaction = require("../transaction/transactionModel")
const User = require("../user/userModel")





const adminDashboard = async(req, res) => {
    let totalCategories = await Category.countDocuments({ isDelete: false })
    let totalCustomers = await Customer.countDocuments({ isDelete: false })
    let pendingProofs = await Proof.countDocuments({ hasVerified: false })
    let totalTasks = await Task.countDocuments({ isDelete: false })
    let newRedeemRequest = await Transaction.countDocuments({ isDelete: false, type: "debit", transactionStatus: 1 })
    let completeTransactions = await Transaction.countDocuments({ isDelete: false, type: "debit", transactionStatus: 3 })



    res.send({
        success: true,
        status: 200,
        message: 'Welcome Admin',
        totalCategories: totalCategories,
        totalCustomers: totalCustomers,
        pendingProofs: pendingProofs,
        totalTasks: totalTasks,
        newRedeemRequest: newRedeemRequest,
        completeTransactions: completeTransactions,
    })

}

module.exports = { adminDashboard }