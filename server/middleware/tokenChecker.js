const jwt  = require("jsonwebtoken")


module.exports = (req, res, next) => {

    const token = req.headers['authorization']

    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, process.env.SECRET, function (err, decoded) {
            if (err) {
                res.status(403).send({
                    success: false,
                    status: 403,
                    message: "UnAuthorized"

                })
            }
            req.decoded = decoded;
            req.decoded.addedById = req.decoded._id
            req.decoded.updatedById = req.decoded._id
            next();
        });
    }
    else {
        res.status(403).send({
            success: false,
            status: 403,
            message: "UnAuthorized"

        })

    }
}