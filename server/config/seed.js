const User = require("../apis/user/userModel")

const userObj = {
    userAutoId: 1,
    name: "Admin",
    email: "admin@admin.com",
    password: "$2b$10$tbSZP8IZYfEw/3FcZZhSLOsuQhxBSw.2dHYcofSnXU9m1fdE.manK",
    isDelete: false,
    isBlocked: false,
    userType: 1,
    phone: 9915710720
}


exports.createAdmin = async () => {
    let existingAdmin = await User.findOne({ email: userObj.email })
    if (!existingAdmin) {
        new User(userObj).save().then(r => {
            console.log("Admin created ")
        })
    }
}