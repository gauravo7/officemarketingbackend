const Task = require('./taskModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')


module.exports = {
    index,
    fetchTaskById,
    addTask,
    updateTask,
    deleteTask
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

        Task.find(find)
            .skip(skip1)
            .limit(lim).populate("categoryId")
            .exec()
            .then(async alldocuments => {
                var total = await Task.countDocuments(find);
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Tasks Loaded",
                    data: alldocuments
                });
            })
            .catch(err => {
                reject({ success: false, status: 500, message: err.message });
            });
    });
}




async function addTask(req, res, next) {
    await addTaskFun(req, next).then(next).catch(next);
}


function addTaskFun(req, next) {
    return new Promise(async (resolve, reject) => {
        const formData = req.body;

        const createSchema = Joi.object().keys({
            title: Joi.string().required(),
            description: Joi.string().optional().default('No description'),
            categoryId: Joi.string().required().optional(),
            price: Joi.number().required(),
            dueDate: Joi.date().required()
        });

        const result = createSchema.validate(formData);
        const { value, error } = result;
        const valid = error == null;

        if (!valid) {
            const { details } = error;
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(', ')
            });
        } else {

            Task.countDocuments()
                .then(total => {
                    var task = new Task();
                    task.taskAutoId = total + 1;
                    task.title = formData.title;
                    task.description = formData.description || 'No description';
                    task.categoryId = formData.categoryId;
                    task.price = formData.price;
                    task.dueDate = formData.dueDate;

                    if (req.decoded.addedById) task.addedById = req.decoded.addedById;

                    task.save()
                        .then(saveRes => {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Task added successfully.",
                                data: saveRes
                            });
                        })
                        .catch(err => {
                            reject({ success: false, status: 500, message: err.message });
                        });
                })
                .catch(err => {
                    reject({ success: false, status: 500, message: err.message });
                });
        }
    });
}





async function fetchTaskById(req, res, next) {
    await fetchTaskByIdFun(req, next).then(next).catch(next);
};


function fetchTaskByIdFun(req, next) {
    let formData = req.body
    return new Promise(async (resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                var finder = { $and: [formData] };
                Task.findOne(finder)
                    .populate("categoryId")
                    .exec()
                    .then(document => {
                        if (document != null) {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Single Task Loaded",
                                data: document
                            });
                        }
                        else {
                            reject("Task not found");
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




async function updateTask(req, res, next) {
    await updateTaskFun(req).then(next).catch(next);
};


function updateTaskFun(req, next) {
    let formData = req.body;
    let isValidated = true;
    return new Promise((resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                Task.findOne({ "_id": formData._id })
                    .then(async res => {
                        if (!res) {
                            reject("Task not found");
                        } else {

                            if (formData.title) res.title = formData.title;
                            if (formData.description) res.description = formData.description;
                            if (formData.categoryId) res.categoryId = formData.categoryId;
                            if (formData.price) res.price = formData.price;
                            if (formData.dueDate) res.dueDate = formData.dueDate;

                            if (req.decoded.updatedById) res.updatedById = req.decoded.updatedById;

                            res.updatedAt = new Date();
                            res.save()
                                .then(updatedTask => {
                                    resolve({
                                        status: 200,
                                        success: true,
                                        message: "Task updated successfully",
                                        data: updatedTask
                                    });
                                })
                                .catch(err => {
                                    reject({ success: false, status: 500, message: err.message });
                                });

                        }
                    })
                    .catch(err => {
                        reject({ success: false, status: 500, message: err.message });
                    });
            } else {
                reject("Invalid ID format");
            }
        } else {
            reject("Please provide an _id to proceed");
        }
    });
}



async function deleteTask(req, res, next) {
    await deleteTaskFun(req).then(next).catch(next);
};


function deleteTaskFun(req, next) {
    let formData = req.body;
    return new Promise((resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            Task.findOne({ "_id": formData._id })
                .then(async res => {

                    if (!res) {
                        reject("Task not found");
                    } else {
                        res.isDelete = true;
                        res.updatedAt = new Date();
                        if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById;
                        res.save()
                            .then(() => {
                                resolve({
                                    status: 200,
                                    success: true,
                                    message: "Task deleted successfully"
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
