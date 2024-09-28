const User = require('./userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const Joi = require('joi')
let salt = bcrypt.genSaltSync(10);


module.exports = {
    login

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






