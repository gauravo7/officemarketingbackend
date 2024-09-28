const Category = require('./categoryModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')


module.exports = {
    index,
    fetchCategoryById,
    addCategory,
    updateCategory,
    deleteCategory
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

        Category.find(find)
            .skip(skip1)
            .limit(lim)
            .exec()
            .then(async alldocuments => {
                var total = 0
                total = await Category.countDocuments(find)
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Categories Loaded",
                    data: alldocuments
                });
            })
            .catch(next)
    });
}



async function addCategory(req, res, next) {
    await addCategoryFun(req, next).then(next).catch(next);
}

function addCategoryFun(req, next) {
    return new Promise(async (resolve, reject) => {
        const formData = req.body;
        

        const createSchema = Joi.object().keys({
            name: Joi.string().required(),
            description: Joi.string().optional()
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
            await Category.findOne({ $and: [{ name: formData.name }, { isDelete: false }] }).then(categoryData => {
                if (!categoryData) {
                    Category.countDocuments()
                        .then(total => {
                            var category = new Category();
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
                } else {
                    reject({ success: false, status: 422, message: "Category already exists with the same name." });
                }

            }).catch(err => {
                reject({ success: false, status: 500, message:  err.message });
            });
        }
    });
}





async function fetchCategoryById(req, res, next) {
    await fetchCategoryByIdFun(req, next).then(next).catch(next);
};


function fetchCategoryByIdFun(req, next) {
    let formData = req.body
    return new Promise(async (resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                var finder = { $and: [formData] };
                Category.findOne(finder)
                    .exec()
                    .then(document => {
                        if (document != null) {
                            resolve({
                                status: 200,
                                success: true,
                                message: "Single Category Loaded",
                                data: document
                            });
                        }
                        else {
                            reject("Category not found");
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



async function updateCategory(req, res, next) {
    await updateCategoryFun(req).then(next).catch(next);
};


function updateCategoryFun(req, next) {
    let formData = req.body;
    let isValidated = true;
    return new Promise((resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            if (db.isValid(formData._id)) {
                Category.findOne({ "_id": formData._id })
                    .then(async res => {
                        if (!res) {
                            reject("Category not found");
                        } else {
                      
                            if (!!formData.name) res.name = formData.name;
                            if (!!formData.description) res.description = formData.description; 
                            if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById;

                            let id = res._id;

                            
                            if (!!formData.name) {
                               
                                await Category.findOne({
                                    $and: [{ name: formData.name }, { isDelete: false }, { _id: { $ne: id } }]
                                }).then(existingCategory => {
                                    if (existingCategory != null)
                                        isValidated = false;
                                });
                            }

                            res.updatedAt = new Date();
                            if (isValidated) {
                                res.save()
                                    .then(res => {
                                        resolve({
                                            status: 200,
                                            success: true,
                                            message: "Category updated successfully",
                                            data: res
                                        });
                                    })
                                    .catch(next);
                            } else {
                                reject("Category exists with the same name");
                            }
                        }

                    })
                    .catch(next);
            } else {
                reject("Invalid ID format");
            }
        } else {
            reject("Please provide an _id to proceed");
        }
    });
}






async function deleteCategory(req, res, next) {
    await deleteCategoryFun(req).then(next).catch(next);
};


function deleteCategoryFun(req, next) {
    let formData = req.body;
    return new Promise((resolve, reject) => {
        if (formData != undefined && formData._id != undefined) {
            Category.findOne({ "_id": formData._id })
                .then(async res => {
                
                    if (!res) {
                        reject("Category not found");
                    } else {
          
                        res.isDelete = true;
                        res.updatedAt = new Date();
                        if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById;

                       
                        res.save()
                            .then(() => {
                                resolve({
                                    status: 200,
                                    success: true,
                                    message: "Category deleted successfully"
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
