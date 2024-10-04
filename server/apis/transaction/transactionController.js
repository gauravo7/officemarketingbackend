const Transaction = require('./transactionModel')
const Proof = require('../proof/proofModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')





module.exports = {

    index,
    fetchTransactionById

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

        Transaction.find(find)
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
    return new Promise(async (resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                var finder = { $and: [formData] };
                Transaction.findOne(finder)
                    .exec()
                    .then(document => {
                        if (document != null) {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Single Transaction Loaded",
                                data: document
                            });
                        }
                        else {
                            reject("Transaction not found");
                        }
                    })
                    .catch(next)
            }
            else {
                reject("Id Format is Wrong")
            }
        }
        else {
            resolve("Please enter _id to Proceed ");
        }
    })
}