const User = require('./userModel')
const Customer = require('../customer/customerModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const Joi = require('joi')
let salt = bcrypt.genSaltSync(10);


module.exports = {
    login,
    index,
    fetchUserById,
    deleteUser,
    changePassword

}


async function login(req, res, next) {
    await loginFun(req, next).then(next).catch(next)
};

function loginFun(req, next) {
    const body = req.body
    const loginSchema = Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    const result = loginSchema.validate(body)
    const { value, error } = result;
    const valid = error == null
    return new Promise(async (resolve, reject) => {
        if (!valid) {
            const { details } = error;
            reject({
                status: 400,
                success: false,
                message: details.map(i => i.message).join(',')
            });
        } else {
            let finder = {}
            if (!!body.email)
                finder = { email: body.email.toLowerCase() }
            User.findOne(finder).populate("role").then(res => {
                if (!!res) {
                    if (!bcrypt.compareSync(body.password, res.password)) {
                        reject("Invalid Username Password")
                    }
                    else {
                        if (res.status == true) {
                            let user = {
                                name: res.name, email: res.email, userType: res.userType, isAdmin: res.isAdmin, _id: res._id
                            }
                            const token = jwt.sign(user, process.env.SECRET)
                            resolve({
                                token: token,
                                status: 200,
                                success: true,
                                message: "Login Sucessfull",
                                data: res
                            });

                        } else {
                            reject("User is Blocked! Contact Admin");
                        }
                    }
                } else {
                    reject("User does not exist");
                }
            }).catch(next)
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
        User.find(find)
            .skip(skip1)
            .limit(lim)
            .exec()
            .then(async alldocuments => {
                let total = 0
                total = await User.countDocuments(find)
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Users Loaded",
                    data: alldocuments
                });
            })
            .catch(next)
    });
}


async function fetchUserById(req, res, next) {
    await fetchUserByIdFun(req, next).then(next).catch(next);
};
function fetchUserByIdFun(req, next) {
    return new Promise(async (resolve, reject) => {
        let formData = req.body
        if (!formData._id) {
            reject("_id is required")
        }
        else {
            let finder = { $and: [formData] };
            User.findOne(finder)
                .exec()
                .then(document => {
                    if (!!document) {
                        resolve({
                            status: 200,
                            success: true,
                            message: "Single User Loaded",
                            data: document
                        });
                    }
                    else {
                        reject("User not found");
                    }
                })
                .catch(next)
        }
    })
}




async function deleteUser(req, res, next) {
    await deleteUserFun(req, next).then(next).catch(next);
};
function deleteUserFun(req, next) {
    let formData = req.body
    return new Promise((resolve, reject) => {
        if (!!formData && !!formData._id) {
            User.findOne({ "_id": formData._id })
                .then(async res => {
                    if (!res)
                        reject("User not found");
                    else {
                        res.isDelete = true
                        res.updatedAt = new Date();
                        if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById
                        res.save()
                            .then(res => {
                                Customer.findOne({ "userId": formData._id })
                                    .then((customerData) => {
                                        if (!customerData) {
                                            reject("customer not found");
                                        }
                                        else {
                                            customerData.isDelete = true
                                            customerData.updatedAt = new Date();
                                            if (!!req.decoded.updatedById) customerData.updatedById = req.decoded.updatedById
                                            customerData.save().then(() => {
                                                {
                                                    resolve({
                                                        status: 200,
                                                        success: true,
                                                        message: "User deleted Successfully"
                                                    })
                                                }

                                            }).catch(next)

                                        }

                                    }).catch(next)

                            })
                            .catch(next)
                    }
                })
                .catch(next)
        }
        else {
            reject("Please enter an _id to Proceed");
        }
    });

}





async function changePassword(req, res, next) {
    await changePasswordFun(req, next).then(next).catch(next);
};

function changePasswordFun(req, next) {
    let formData = req.body;
    let isValidated = true;

    return new Promise((resolve, reject) => {
        if (!formData._id) {
            return reject("_id is required");
        }
        if (!formData.currentPassword) {
            return reject("Current password is required");
        }
        if (!formData.newPassword) {
            return reject("New password is required");
        }
        if (!formData.confirmPassword) {
            return reject("Please provide a confirmation password");
        }
        if (formData.newPassword !== formData.confirmPassword) {
            return reject("New password and confirm password must be the same.");
        }

        User.findOne({ "_id": formData._id })
            .then(async user => {
                if (!user) {
                    return reject("User not found");
                }
                const isMatch = bcrypt.compareSync(formData.currentPassword, user.password);
                if (!isMatch) {
                    return reject("Current password is incorrect");
                }


                if (formData.newPassword === formData.currentPassword) {
                    return reject("New password cannot be the same as current.");
                }

                user.password = bcrypt.hashSync(formData.newPassword, salt);
                user.updatedAt = new Date();
                user.save()
                    .then(savedUser => {
                        resolve({
                            status: 200,
                            success: true,
                            message: "Your password is now updated.",
                            data: savedUser
                        });
                    })
                    .catch(next);
            })
            .catch(next);
    });
}