const Role = require('./roleAndPermissionModel')
const db = require('../../config/db')
const Joi = require('joi')

module.exports = {
    index,
    fetchRoleById,
    addRole,
    updateRole,
    deleteRole
}

async function index(req, res, next) {
    await indexFun(req, next).then(next).catch(next)
};
function indexFun(req, next) {
    return new Promise((resolve, reject) => {
        var lim = 100000;
        var skip1 = 0;
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
        var find = { $and: [formData] }
        Role.find(find)
            .skip(skip1)
            .limit(lim)
            .exec()
            .then(async alldocuments => {
                var total = 0
                total = await Role.countDocuments(find)
                resolve({
                    status: 200,
                    success: true,
                    total: total,
                    message: "All Roles Loaded",
                    data: alldocuments
                });
            })
            .catch(next)
    });
}
async function addRole(req, res, next) {
    await addRoleFun(req, next).then(next).catch(next)
};
function addRoleFun(req, next) {
    const body = req.body
    const addRoleSchema = Joi.object().keys({
        name: Joi.string().required(),
        permissions: Joi.array().required()
    });
    const result = addRoleSchema.validate(body)
    const { value, error } = result;
    const valid = error == null
    return new Promise(async (resolve, reject) => {
        if (!valid) {
            const { details } = error;
            reject(details.map(i => i.message).join(','));
        } else {
            await Role.findOne({ $and: [{ name: { '$regex': body.name, '$options': 'i' } }, { isDelete: false }] }).then(roleData => {
                if (!roleData) {
                    Role.countDocuments()
                        .then(total => {
                            let role = Role()
                            role.roleAutoId = total + 1
                            role.name = body.name.toUpperCase()
                            role.permissions = body.permissions
                            if (req.decoded.addedById) role.addedById = req.decoded.addedById
                            role.save()
                                .then(saveRes => {
                                    resolve({
                                        status: 200,
                                        success: true,
                                        message: "Role added successfully.",
                                        data: saveRes
                                    })
                                }).catch(next)
                        })
                } else {
                    reject("Role already exists with same name " + roleData.name)
                }
            })
        }
    })
}
async function fetchRoleById(req, res, next) {
    await fetchRoleByIdFun(req, next).then(next).catch(next)
};
function fetchRoleByIdFun(req, next) {
    return new Promise(async (resolve, reject) => {
        let formData = req.body
        if (!formData._id) {
            reject("_id is required")
        }
        else {
            var finder = { $and: [req.body] };
            Role.findOne(finder)
                .exec()
                .then(document => {
                    if (document != null) {
                        resolve({
                            status: 200,
                            success: true,
                            message: "Single Role Loaded",
                            data: document
                        });
                    }
                    else {
                        reject("Role not found");
                    }
                })
                .catch(next)
        }

    })
}
async function updateRole(req, res, next) {
    await updateRoleFun(req, next).then(next).catch(next)
};
function updateRoleFun(req, next) {
    let formData = req.body
    let isValidated = true

    return new Promise((resolve, reject) => {
        if (req.body != undefined && req.body._id != undefined) {
            if (db.isValid(req.body._id)) {
                Role.findOne({ "_id": req.body._id })
                    .then(async res => {
                        if (!res)
                            reject("Role not found");
                        else {
                            if (!!formData.name) res.name = formData.name
                            if (!!formData.permissions) res.permissions = formData.permissions
                            if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById
                            let id = res._id
                            if (!!formData.name) {
                                await Role.findOne({ $and: [{ name: formData.name }, { isDelete: false }, { _id: { $ne: id } }] }).then(existingRole => {
                                    if (existingRole != null)
                                        isValidated = false
                                })
                            }
                            res.updatedAt = new Date();
                            if (isValidated) {
                                res.save()
                                    .then(res => {
                                        {
                                            resolve({
                                                status: 200,
                                                success: true,
                                                message: "Role Updated Successfully",
                                                data: res
                                            })
                                        }
                                    })
                                    .catch(next)
                            } else reject("Role exists with same email")
                        }

                    })
                    .catch(next)
            }
            else {
                reject("Id Format is Wrong");
            }
        }
        else {
            reject("Please enter an _id to Proceed");
        }
    });

}
async function deleteRole(req, res, next) {
    await deleteRoleFun(req, next).then(next).catch(next)
};
function deleteRoleFun(req, next) {
    let formData = req.body
    return new Promise((resolve, reject) => {
        if (!formData._id) {
            reject("_id is required")
        } else {
            Role.findOne({ "_id": formData._id })
                .then(async res => {
                    if (!res)
                        reject("Role not found")
                    else {
                        res.isDelete = true
                        res.updatedAt = new Date();
                        if (!!req.decoded.updatedById) res.updatedById = req.decoded.updatedById
                        res.save()
                            .then(res => {
                                {
                                    resolve({ status: 200, success: true, message: "Role deleted Successfully" })
                                }
                            })
                            .catch(next)
                    }
                })
                .catch(next)
        }

    });

}

