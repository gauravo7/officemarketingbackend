const Transaction = require('./transactionModel')
const Proof = require('../proof/proofModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')





module.exports = {

    addTransaction,

}

async function addTransaction(req, res, next) {
    await addTransactionFun(req, next).then(next).catch(next);
}

function addTransactionFun(req, next) {
    return new Promise(async (resolve, reject) => {
        const formData = req.body;


        const createSchema = Joi.object().keys({
            userId: Joi.string().required(),
            type: Joi.string().valid('credit', 'debit').required(),
            amount: Joi.number().required(),
            proofId: Joi.string().required(),


        });

        const result = createSchema.validate(formData);
        const { value, error } = result;
        const valid = error == null;

        if (!valid) {
            const { details } = error;
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(',')
            });
        } else {

            if (formData.type == 'credit') {
                await Proof.findOne({ $and: [{ _id: formData.proofId }, { isDelete: false }] }).then(proofData => {
                    if (proofData) {

                        if (proofData.hasVerified == false) {
                            reject({ success: false, status: 400, message: "Proof is not verified yet." });
                            return;

                        }
                        else {

                            Transaction.countDocuments()
                                .then(total => {
                                    var category = new Transaction();
                                    category.categoryAutoId = total + 1;
                                    category.name = formData.name;
                                    category.description = formData.description;

                                    if (req.decoded.addedById) category.addedById = req.decoded.addedById;

                                    category.save()
                                        .then(saveRes => {
                                            resolve({
                                                status: 200, success: true, message: "Category added successfully.", data: saveRes
                                            });
                                        }).catch(err => {
                                            reject({ success: false, status: 500, message: err.message });
                                        });

                                });

                        }


                    } else {
                        reject({ success: false, status: 404, message: "Proof not found" });
                        return;
                    }

                }).catch(err => {
                    reject({ success: false, status: 500, message: err.message });
                });
            }

            else if (formData.type == 'debit') {

            }
            else {

            }

        }
    });
}