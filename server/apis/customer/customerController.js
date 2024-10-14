const User = require('../user/userModel')
const Customer = require('./customerModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')
const bcrypt = require("bcrypt")


module.exports = {
    addCustomer,
    index,
    fetchCustomerById,
    updateCustomer
}


async function addCustomer(req, res, next) {
    await addCustomerFun(req, next).then(next).catch(next);
}

function addCustomerFun(req, next) {
    return new Promise(async (resolve, reject) => {
        const formData = req.body
        console.log(formData)
        const createSchema = Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().required(),
            password: Joi.string().required(),
            profile: Joi.string().optional(),
            trimProfile: Joi.string().optional(),
            phone: Joi.string().required(),
            address: Joi.string().optional(),
        });
        const result = createSchema.validate(formData)
        const { value, error } = result
        const valid = error == null
        if (!valid) {
            const { details } = error;
            helper.unlinkImage(req.file)
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(',')
            });
        } else {
            await User.findOne({ $and: [{ email: formData.email }, { isDelete: false }] }).then(userData => {
                if (!userData) {

                    User.countDocuments().then(total => {
                        var user = new User()
                        user.userAutoId = total + 1
                        user.name = formData.name
                        user.email = formData.email
                        user.phone = formData.phone
                        user.password = bcrypt.hashSync(formData.password, 10);
                        user.userType = 2
                        user.save().then((saveUser) => {
                            Customer.countDocuments()
                                .then(total => {
                                    var customer = new Customer()
                                    customer.customerAutoId = total + 1
                                    customer.name = formData.name
                                    customer.userId = saveUser._id
                                    customer.email = formData.email
                                    customer.phone = formData.phone
                                    customer.address = formData.address
                                    customer.save()
                                        .then(saveRes => {
                                            user.customerId = saveRes._id
                                            user.save()
                                            resolve({
                                                status: 200,
                                                success: true,
                                                message: "User registered successfully.",
                                                data: saveRes
                                            })
                                        }).catch(err => {
                                            helper.unlinkImage(req.file)
                                            reject({ success: false, status: 500, message: err })
                                        })
                                })

                        })

                    })

                } else {
                    helper.unlinkImage(req.file)
                    reject({ success: false, status: 422, message: "user already exists with same email" })
                }

            })
        }
    })
}




async function index(req, res, next) {
    await indexFun(req, next).then(next).catch(next);
};

function indexFun(req, next) {
    return new Promise((resolve, reject) => {
        let lim = 100000;
        let skip1 = 0;
        let formData = {}
        if (!!req.body)
            formData = req.body
        else formData = req
        formData.isDelete = false
        if (formData.startpoint != undefined) {
            skip1 = parseInt(formData.startpoint)
            lim = 10;
            delete formData.startpoint
        }
        let find = { $and: [formData] }
        Customer.find(find).populate("userId")
            .skip(skip1)
            .limit(lim)
            .exec()
            .then(async alldocuments => {
                let total = 0
                total = await Customer.countDocuments(find)
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Customers Loaded",
                    data: alldocuments
                });
            })
            .catch(next)
    });
}



async function fetchCustomerById(req, res, next) {
    await fetchCustomerByIdFun(req, next).then(next).catch(next);
};

function fetchCustomerByIdFun(req, next) {
    return new Promise(async (resolve, reject) => {
        let formData = req.body
        if (!formData._id) {
            reject("_id is required")
        } else {
            let finder = { $and: [formData] };
            Customer.findOne(finder).populate("userId").populate("categoryId")
                .exec()
                .then(document => {
                    if (!!document) {
                        resolve({
                            status: 200,
                            success: true,
                            message: "Single Customer Loaded",
                            data: document
                        });
                    } else {
                        reject("customer not found");
                    }
                })
                .catch(next)
        }
    })
}



async function updateCustomer(req, res, next) {
    await updateCustomerFun(req, next).then(next).catch(next);
};

function updateCustomerFun(req, next) {
    let formData = req.body;
    return new Promise((resolve, reject) => {

        if (!formData._id) {
            reject("_id is required");
        } else {
            Customer.findOne({ "_id": formData._id })
                .then(async customerData => {
                    if (!customerData) {
                        reject("Customer not found");
                    } else {
                        if (!!formData.name) customerData.name = formData.name;
                        if (!!formData.phone) customerData.phone = formData.phone;
                        if (!!formData.address) customerData.address = formData.address;
                        if (!!formData.profile) customerData.profile = "profile/" + formData.profile;
                        if (!!formData.trimProfile) customerData.trimProfile = "profile/" + formData.trimProfile;
                        if (!!req.decoded.updatedById) customerData.updatedById = req.decoded.updatedById;
                        customerData.updatedAt = new Date();
                        customerData.save()
                            .then(res => {
                                User.findOne({ "_id": customerData.userId })
                                    .then((userData) => {
                                        if (!!formData.name) userData.name = formData.name;
                                        if (!!formData.phone) userData.phone = formData.phone;
                                        if (!!req.decoded.updatedById) userData.updatedById = req.decoded.updatedById;
                                        userData.updatedAt = new Date();

                                        userData.save().then(() => {
                                            resolve({
                                                status: 200,
                                                success: true,
                                                message: "Profile Updated Successfully",
                                                data: res
                                            });
                                        }).catch(next);
                                    }).catch(next);
                            }).catch(next);
                    }
                }).catch(next);
        }
    });
}