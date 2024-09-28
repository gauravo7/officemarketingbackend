const User = require('../user/userModel')
const Customer = require('./customerModel')
const Joi = require('joi')
const helper = require('../../utilities/helper')
const db = require('../../config/db')
const bcrypt = require("bcrypt")


module.exports = {
    addCustomer
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
            profile: Joi.string().required(),
            trimProfile: Joi.string().optional(),
            phone: Joi.string().required(),
            address: Joi.string().required(),
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
                                    customer.profile = "profile/" + req.body.profile;
                                    customer.trimProfile = "profile/" + req.body.trimProfile
                                    customer.save()
                                        .then(saveRes => {
                                            resolve({
                                                status: 200, success: true, message: "User registered successfully.", data: saveRes
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