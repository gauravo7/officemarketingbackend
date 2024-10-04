const Proof = require('./proofModel')
const Customer = require('../customer/customerModel')
const Transaction = require('../transaction/transactionModel')
const Task = require('../task/taskModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')





module.exports = {
    addProof,
    verifyProof,
    index,
    fetchProofById,
    deleteProof,
    updateProof,
    addAttachmentInProof
}






async function addProof(req, res, next) {
    await addProofFun(req, next).then(next).catch(next);
}




function addProofFun(req, next) {
    return new Promise(async (resolve, reject) => {
        const formData = req.body;
        const createSchema = Joi.object().keys({
            taskId: Joi.string().required(),
            userId: Joi.string().required(),
            comments: Joi.string().optional(),
            feedback: Joi.string().optional(),
            attachments: Joi.alternatives().try(
                Joi.array().items(Joi.string().required()).min(1),
                Joi.string()
            ).required(),
            trimAttachments: Joi.array().items(Joi.string())
        });

        const result = createSchema.validate(formData);
        const { value, error } = result;
        const valid = error == null;

        if (!valid) {
            const { details } = error;
            helper.unlinkImage(req.file);
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(','),
            });
        } else {
            Task.findOne({ _id: formData.taskId })
                .then((task) => {
                    if (!task) {
                        reject("Task not found");
                    } else {
                        const currentDate = new Date();
                        if (currentDate > new Date(task.dueDate)) {
                            reject("Task deadline exceeded.");
                            return;
                        } else {
                            Proof.countDocuments().then(total => {
                                let proof = new Proof();
                                proof.proofAutoId = total + 1;
                                proof.taskId = formData.taskId;
                                proof.userId = formData.userId;
                                proof.comments = formData.comments || '';
                                proof.feedback = formData.feedback || '';

                                proof.attachments = req.files.map(file => "attachments/" + file.filename);


                                proof.trimAttachments = req.body.trimAttachments.map(trimFile => "attachments/" + trimFile);

                                if (req.decoded.addedById) proof.addedById = req.decoded.addedById;

                                proof.save()
                                    .then(saveRes => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Proof uploaded successfully",
                                            data: saveRes
                                        });
                                    })
                                    .catch(err => {
                                        helper.unlinkImage(req.file);
                                        reject({ success: false, status: 500, message: err });
                                    });
                            });
                        }
                    }
                })
                .catch(next);
        }
    });
}







async function verifyProof(req, res, next) {
    await verifyProofFun(req).then(next).catch(next);
};


function verifyProofFun(req, next) {
    let formData = req.body;
    return new Promise((resolve, reject) => {
        if (formData && formData._id) {
            if (db.isValid(formData._id)) {
                if (formData.hasVerified === undefined || (formData.hasVerified !== 'true' && formData.hasVerified !== 'false')) {
                    reject("Please provide a valid value for hasVerified (true or false).");
                    return;
                }
                if (formData.submissionStatus == undefined) {
                    reject("Submission status is required");
                    return;
                }
                Proof.findOne({ "_id": formData._id })
                    .then(async proofData => {
                        if (!proofData) {
                            reject("Proof not found");
                        } else {

                            if (formData.hasVerified === 'false' && formData.submissionStatus === 2 || formData.submissionStatus === "2") {
                                proofData.submissionStatus = 2; //inProgress
                                proofData.hasVerified = false;
                            } else if (formData.hasVerified === 'false' && formData.submissionStatus === 3 || formData.submissionStatus === "3") {
                                proofData.verificationComments = formData.verificationComments;
                                proofData.submissionStatus = 3; //resubmission
                                proofData.hasVerified = false;
                            } else if (formData.hasVerified === 'true' && formData.submissionStatus === "4") {
                                await Task.findOne({ _id: proofData.taskId, isDelete: false }).then(async (taskData) => {
                                    if (!taskData) {
                                        reject("Task not found");
                                    } else {
                                        await Customer.findOne({ userId: proofData.userId, isDelete: false }).then(async (userData) => {
                                            if (!userData) {
                                                reject("User not found");
                                            } else {

                                                proofData.verificationComments = formData.verificationComments || '';
                                                proofData.submissionStatus = 4; //closed
                                                proofData.hasVerified = true;

                                                userData.balance += taskData.price;
                                                userData.totalEarned += taskData.price;

                                                await userData.save().then(async () => {

                                                    await Transaction.countDocuments()
                                                        .then(total => {
                                                            var transaction = new Transaction();
                                                            transaction.transactionAutoId = total + 1;
                                                            transaction.userId = proofData.userId;
                                                            transaction.type = "credit";
                                                            transaction.amount = taskData.price;
                                                            transaction.taskId = taskData._id;
                                                            transaction.proofId = proofData._id;
                                                            transaction.remarks = formData.remarks;
                                                            if (req.decoded.addedById) transaction.addedById = req.decoded.addedById;

                                                            transaction.save()

                                                        });
                                                });


                                            }
                                        }).catch(err => {
                                            reject("Error while finding user: " + err.message);
                                        });
                                    }
                                }).catch(err => {
                                    reject("Error while finding task: " + err.message);
                                });
                            } else {
                                reject("Invalid submission status for the provided hasVerified value.");
                            }

                            if (req.decoded.updatedById) proofData.updatedById = req.decoded.updatedById;
                            proofData.updatedAt = new Date();

                            // Save the proof data

                            if (formData.hasVerified == 'true' && formData.submissionStatus === "4") {
                                proofData.save()
                                    .then(updatedRes => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Proof verified, transaction recorded successfully.",
                                            data: updatedRes
                                        });
                                    })
                                    .catch(err => {
                                        reject("Error while saving proof: " + err.message);
                                    });
                            }
                            else {
                                proofData.save()
                                    .then(updatedRes => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Proof verification updated successfully.",
                                            data: updatedRes
                                        });
                                    })
                                    .catch(err => {
                                        reject("Error while saving proof: " + err.message);
                                    });
                            }




                        }
                    })
                    .catch(err => {
                        reject("Error while finding proof: " + err.message);
                    });
            } else {
                reject("Invalid ID format");
            }
        } else {
            reject("Please provide an _id to proceed.");
        }
    });
}






async function index(req, res, next) {
    await indexFun(req, next).then(next).catch(next);
};

function indexFun(req, next) {
    return new Promise((resolve, reject) => {
        var lim = 10;
        var skip1 = 0;
        let formData = {};

        if (req.body != undefined) {
            formData = req.body;
        } else {
            formData = req;
        }

        formData.isDelete = false;

        if (formData.startpoint != undefined) {
            skip1 = parseInt(formData.startpoint);
            delete formData.startpoint;
        }
        const find = { $and: [formData] };
        Proof.find(find)
            .skip(skip1)
            .limit(lim).populate("taskId").populate("userId")
            .exec()
            .then(async alldocuments => {
                var total = await Proof.countDocuments(find);
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Proofs Loaded",
                    data: alldocuments
                });
            })
            .catch(err => {
                reject({ success: false, status: 500, message: err.message });
            });
    });
}



async function fetchProofById(req, res, next) {
    await fetchProofByIdFun(req, next).then(next).catch(next);
};


function fetchProofByIdFun(req, next) {
    let formData = req.body
    return new Promise(async (resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                var finder = { $and: [formData] };
                Proof.findOne(finder).populate("taskId").populate("userId")
                    .exec()
                    .then(document => {
                        if (document != null) {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Single Proof Loaded",
                                data: document
                            });
                        }
                        else {
                            reject("Proof not found");
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




async function deleteProof(req, res, next) {
    await deleteProofFun(req).then(next).catch(next);
};


function deleteProofFun(req, next) {
    let formData = req.body;
    return new Promise((resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            Proof.findOne({ "_id": formData._id })
                .then(async res => {

                    if (!res) {
                        reject("Proof not found");
                    } else {
                        res.isDelete = true;
                        res.updatedAt = new Date();
                        if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById;

                        res.save()
                            .then(() => {
                                resolve({
                                    status: 200,
                                    success: true,
                                    message: "Proof deleted successfully"
                                });
                            })
                            .catch(next);
                    }
                })
                .catch(next);
        } else {
            reject("Please enter an _id to proceed");
        }
    });
}


async function updateProof(req, res, next) {
    await updateProofFun(req).then(next).catch(next);
};

function updateProofFun(req, next) {
    let formData = req.body;
    return new Promise((resolve, reject) => {
        if (formData && formData._id) {
            if (db.isValid(formData._id)) {
                Proof.findOne({ "_id": formData._id })
                    .then(async res => {
                        if (!res) {
                            reject("Proof not found");
                        } else {
                            if (res.submissionStatus === 4) {
                                reject("Proof cannot be updated, submission is closed.");
                            }
                            else if (res.submissionStatus === 2) {
                                reject("Proof cannot be updated, submission is in progress.");
                            }
                            else if (res.hasVerified === true) {
                                reject("Proof cannot be updated, it has already been verified.");
                            } else {

                                if (!!formData.comments) res.comments = formData.comments;
                                if (!!formData.feedback) res.feedback = formData.feedback;

                                const index = parseInt(formData.index, 10);

                                if (!isNaN(index)) {

                                    if (formData.attachments && index >= 0 && index < res.attachments.length) {
                                        res.attachments[index] = "attachments/" + formData.attachments; // 
                                    } else if (formData.attachments) {
                                        reject("Invalid attachment index provided.");
                                    }


                                    if (formData.trimAttachments && index >= 0 && index < res.trimAttachments.length) {
                                        res.trimAttachments[index] = "attachments/" + formData.trimAttachments;
                                    } else if (formData.trimAttachments) {
                                        reject("Invalid trim attachment index provided.");
                                    }
                                } else {
                                    reject("Invalid index provided.");
                                }


                                if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById;
                                res.updatedAt = new Date();

                                res.save()
                                    .then(updatedRes => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Proof updated successfully",
                                            data: updatedRes
                                        });
                                    })
                                    .catch(next);
                            }
                        }
                    })
                    .catch(next);
            } else {
                reject("Invalid ID format");
            }
        } else {
            reject("Please provide an _id to proceed.");
        }
    });
}








async function addAttachmentInProof(req, res, next) {
    await addAttachmentInProofFun(req, next).then(next).catch(next);
}

function addAttachmentInProofFun(req, next) {
    return new Promise(async (resolve, reject) => {
        const formData = req.body;
        const createSchema = Joi.object().keys({
            _id: Joi.string().required(),
            attachments: Joi.alternatives().try(
                Joi.array().items(Joi.string().required()).min(1),
                Joi.string().required()
            ).required(),
            trimAttachments: Joi.alternatives().try(
                Joi.array().items(Joi.string().required()).min(1),
                Joi.string().optional()
            ).optional()
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
            Proof.findOne({ _id: formData._id })
                .then(proof => {
                    if (!proof) {
                        reject({
                            status: 404,
                            success: false,
                            message: "Proof not found"
                        });
                    } else {
    
                        if ((proof.submissionStatus === 1 || proof.submissionStatus === 3) && proof.hasVerified === false) {
                     
                            let newAttachments;
                            if (Array.isArray(formData.attachments)) {
                                newAttachments = formData.attachments;
                            } else {
                                newAttachments = [formData.attachments];
                            }

                            proof.attachments = proof.attachments.concat(newAttachments.map(file => "attachments/" + file));

                            // Handle trimAttachments (optional)
                            if (formData.trimAttachments) {
                                let newTrimAttachments;
                                if (Array.isArray(formData.trimAttachments)) {
                                    newTrimAttachments = formData.trimAttachments;
                                } else {
                                    newTrimAttachments = [formData.trimAttachments];
                                }

                                proof.trimAttachments = proof.trimAttachments.concat(newTrimAttachments.map(trimFile => "attachments/" + trimFile));
                            }

                    
                            if (!!req.decoded.updatedById) proof.updatedById = req.decoded.updatedById;
                            proof.updatedAt = new Date();

                            proof.save()
                                .then(updatedProof => {
                                    resolve({
                                        status: 200,
                                        success: true,
                                        message: "Attachments added successfully",
                                        data: updatedProof
                                    });
                                })
                                .catch(err => {
                                    reject({
                                        status: 500,
                                        success: false,
                                        message: "Error while saving proof: " + err.message
                                    });
                                });
                        } else {
                            reject({
                                status: 400,
                                success: false,
                                message: "Attachments can't be added as proof is either verified or in progress."
                            });
                        }
                    }
                })
                .catch(err => {
                    reject({
                        status: 500,
                        success: false,
                        message: "Error while finding proof: " + err.message
                    });
                });
        }
    });
}
