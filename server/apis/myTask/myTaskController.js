const myTask = require("./myTaskModel")
const Task = require('../task/taskModel')
const Customer = require('../customer/customerModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')





module.exports = {
    addMyTask,
    fetchMyTaskById,
    index
}



async function addMyTask(req, res, next) {
    await addMyTaskFun(req, next).then(next).catch(next);
}

function addMyTaskFun(req, next) {
    return new Promise(async(resolve, reject) => {
        const formData = req.body;


        const createSchema = Joi.object().keys({
            userId: Joi.string().required(),
            taskId: Joi.string().required()
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
            await Task.findOne({ $and: [{ _id: formData.taskId }, { isDelete: false }] }).then(async taskData => {
                if (!taskData) {
                    reject({ success: false, status: 422, message: "Task Not found" });

                } else {
                    const currentDate = new Date();
                    if (currentDate > new Date(taskData.dueDate)) {
                        reject("Task deadline exceeded.");
                        return;
                    } else {

                        await Customer.findOne(({ $and: [{ userId: formData.userId }, { isDelete: false }] })).then((custmerData) => {
                            myTask.countDocuments()
                                .then(total => {
                                    var newTask = new myTask();
                                    newTask.autoId = total + 1;
                                    newTask.userId = formData.userId;
                                    newTask.customerId = custmerData._id;
                                    newTask.taskId = formData.taskId;
                                    if (req.decoded.addedById) newTask.addedById = req.decoded.addedById;
                                    newTask.save()
                                        .then(saveRes => {
                                            resolve({
                                                status: 200,
                                                success: true,
                                                message: "Added Successfully",
                                                data: saveRes
                                            });
                                        }).catch(err => {
                                            reject({ success: false, status: 500, message: err.message });
                                        });

                                });
                        })

                    }

                }

            }).catch(err => {
                reject({ success: false, status: 500, message: err.message });
            });
        }
    });
}



async function fetchMyTaskById(req, res, next) {
    await fetchMyTaskByIdFun(req, next).then(next).catch(next);
};


function fetchMyTaskByIdFun(req, next) {
    let formData = req.body
    return new Promise(async(resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                var finder = { $and: [formData] };
                myTask.findOne(finder).populate("userId").populate("taskId")
                    .exec()
                    .then(document => {
                        if (document != null) {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Single Task Loaded",
                                data: document
                            });
                        } else {
                            reject("Task not found");
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


async function index(req, res, next) {
    await indexFun(req, next).then(next).catch(next);
};

function indexFun(req, next) {
    return new Promise((resolve, reject) => {
        var lim = 10000;
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

        myTask.find(find).populate("userId").populate("taskId").populate("proofId")
            .skip(skip1)
            .limit(lim)
            .exec()
            .then(async alldocuments => {
                var total = 0
                total = await myTask.countDocuments(find)
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Tasks Loaded",
                    data: alldocuments
                });
            })
            .catch(next)
    });
}