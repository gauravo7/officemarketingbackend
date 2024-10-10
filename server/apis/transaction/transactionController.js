const Transaction = require('./transactionModel')
const Customer = require('../customer/customerModel')
const Proof = require('../proof/proofModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')





module.exports = {
    index,
    fetchTransactionById,
    redeemRequest,
    createTransaction

}

async function index(req, res, next) {
    await indexFun(req, next).then(next).catch(next);
};

function indexFun(req, next) {
    return new Promise((resolve, reject) => {
        var lim = 100000;
        var skip1 = 0;
        let formData = {}
        if (req.body != undefined)
            formData = req.body
        else formData = req
        formData.isDelete = false
        if (formData.startpoint != undefined) {
            skip1 = parseInt(formData.startpoint)
            lim = 10;
            delete formData.startpoint
        }
        var find = { $and: [formData] }

        Transaction.find(find).populate("customerId").populate("userId")
            .skip(skip1)
            .limit(lim)
            .exec()
            .then(async alldocuments => {
                var total = 0
                total = await Transaction.countDocuments(find)
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Transactions Loaded",
                    data: alldocuments
                });
            })
            .catch(next)
    });
}



async function fetchTransactionById(req, res, next) {
    await fetchTransactionByIdFun(req, next).then(next).catch(next);
};


function fetchTransactionByIdFun(req, next) {
    let formData = req.body
    return new Promise(async(resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                var finder = { $and: [formData] };
                Transaction.findOne(finder).populate("customerId").populate("userId")
                    .exec()
                    .then(document => {
                        if (document != null) {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Single Transaction Loaded",
                                data: document
                            });
                        } else {
                            reject("Transaction not found");
                        }
                    })
                    .catch(next)
            } else {
                reject("Id Format is Wrong")
            }
        } else {
            resolve("Please enter _id to Proceed ");
        }
    })


}


async function redeemRequest(req, res, next) {
    await redeemRequestFun(req, next).then(next).catch(next);
}


function redeemRequestFun(req, next) {
    return new Promise(async(resolve, reject) => {
        const formData = req.body;

        const createSchema = Joi.object().keys({
            userId: Joi.string().required(),
            accountDetails: Joi.string().required(),
            amount: Joi.number().required() // This already checks the minimum requirement
        });

        const result = createSchema.validate(formData);
        const { value, error } = result;
        const valid = error == null;

        if (!valid) {
            const { details } = error;
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(','),
            });
        } else {
            // Check if customer exists
            await Customer.findOne({ $and: [{ userId: formData.userId }, { isDelete: false }] }).then((customerData) => {
                if (!customerData) {
                    reject("Customer not found");
                } else {
                    if (formData.amount < 500) {
                        reject({
                            status: 400,
                            success: false,
                            message: "You cannot redeem less than 500"
                        });
                        return;
                    }
                    if (formData.amount > customerData.balance) {
                        reject({
                            status: 400,
                            success: false,
                            message: "Insufficient balance to process this request."
                        });
                        return;
                    } else {
                        Transaction.countDocuments().then(total => {
                            var transaction = new Transaction();
                            transaction.transactionAutoId = total + 1;
                            transaction.userId = formData.userId;
                            transaction.customerId = customerData._id;
                            transaction.amount = formData.amount;
                            transaction.accountDetails = formData.accountDetails;
                            transaction.type = "debit";
                            transaction.transactionStatus = 1;
                            transaction.transactionId = null;
                            transaction.paymentMethod = null;
                            if (req.decoded.addedById) transaction.addedById = req.decoded.addedById;
                            transaction.save()
                                .then(saveRes => {
                                    customerData.pendingRequests += 1
                                    customerData.balance -= formData.amount; // Deduct amount from balance
                                    customerData.save()
                                    resolve({
                                        status: 200,
                                        success: true,
                                        message: "Awesome! Your request is in progress",
                                        data: saveRes
                                    });
                                }).catch(err => {
                                    reject({ success: false, status: 500, message: err });
                                });
                        });

                    }


                }
            }).catch(err => {
                reject({ success: false, status: 500, message: err });
            });
        }
    });
}



async function createTransaction(req, res, next) {
    await createTransactionFun(req, next).then(next).catch(next);
}


function createTransactionFun(req, next) {
    return new Promise(async(resolve, reject) => {
        const formData = req.body;

        const createSchema = Joi.object().keys({
            _id: Joi.string().required(),
            transactionStatus: Joi.number().required(), // '2' = rejected, '3' = completed
            remarks: Joi.string().optional(),
            paymentMethod: Joi.string().optional(),
            transactionId: Joi.string().optional(),
        });

        const result = createSchema.validate(formData);
        const { value, error } = result;
        const valid = error == null;

        if (!valid) {
            const { details } = error;
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(','),
            });
        } else {

            await Transaction.findOne({ $and: [{ _id: formData._id }, { isDelete: false }] }).then((transactionData) => {
                if (!transactionData) {
                    reject("Transaction not found");
                } else {



                    if (transactionData.transactionStatus == 3) {

                        reject({
                            status: 400,
                            success: false,
                            message: "This transaction has already been completed and cannot be rejected."
                        });
                        return;
                    }

                    if (transactionData.transactionStatus == 2) {
                        reject({
                            status: 400,
                            success: false,
                            message: "This transaction has already been rejected"
                        });
                        return;
                    }


                    if (formData.transactionStatus == 2) {



                        transactionData.transactionStatus = 2; // Set status to rejected
                        transactionData.remarks = formData.remarks;
                        if (!!req.decoded.updatedById) transactionData.updatedById = req.decoded.updatedById;
                        transactionData.updatedAt = new Date();

                        transactionData.save().then(() => {
                            Customer.findOne({ userId: transactionData.userId }).then((customerData) => {
                                customerData.balance += transactionData.amount;
                                customerData.pendingRequests -= 1;
                                if (!!req.decoded.updatedById) customerData.updatedById = req.decoded.updatedById;
                                customerData.updatedAt = new Date();

                                customerData.save()
                                    .then(saveRes => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Request rejected.",
                                            data: saveRes
                                        });
                                    }).catch(err => {
                                        reject({ success: false, status: 500, message: err });
                                    });
                            });
                        }).catch(err => {
                            reject({ success: false, status: 500, message: err });
                        });

                        // Handle completion
                    } else {
                        if (!formData.paymentMethod) {
                            reject({
                                status: 400,
                                success: false,
                                message: "Payment method is required."
                            });
                            return;
                        }
                        if (!formData.transactionId) {
                            reject({
                                status: 400,
                                success: false,
                                message: "Transaction ID is required."
                            });
                            return;
                        }

                        transactionData.transactionStatus = 3; // Set status to completed
                        transactionData.remarks = formData.remarks;
                        transactionData.paymentMethod = formData.paymentMethod;
                        transactionData.transactionId = formData.transactionId;
                        if (!!req.decoded.updatedById) transactionData.updatedById = req.decoded.updatedById;
                        transactionData.updatedAt = new Date();

                        transactionData.save().then(() => {
                            Customer.findOne({ userId: transactionData.userId }).then((customerData) => {
                                customerData.totalWithdrawn += transactionData.amount;
                                customerData.pendingRequests -= 1;
                                if (!!req.decoded.updatedById) customerData.updatedById = req.decoded.updatedById;
                                customerData.updatedAt = new Date();

                                customerData.save()
                                    .then(saveRes => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Transaction completed successfully.",
                                            data: saveRes
                                        });
                                    }).catch(err => {
                                        reject({ success: false, status: 500, message: err });
                                    });
                            });
                        }).catch(err => {
                            reject({ success: false, status: 500, message: err });
                        });
                    }
                }
            }).catch(err => {
                reject({ success: false, status: 500, message: err });
            });
        }
    });
}