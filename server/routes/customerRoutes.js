const router = require('express').Router()
const sharp = require('sharp');
const multer = require('multer')
const path = require("path")

const userController = require('../apis/user/userController')
const customerController = require('../apis/customer/customerController')
const proofController = require('../apis/proof/proofController')
var helper = require('../utilities/helper')

/** AUTHENTICATION */
router.post('/login', userController.login)



async function trim(req) {
    if (req && req.file && req.file.path) {
        const trimmedFileName = "trim_" + req.body.profile;
        try {
            await sharp(req.file.path)
                .resize(100)
                .jpeg({ quality: 80 })
                .toFile(path.join(req.file.destination, trimmedFileName));


            req.body.trimProfile = trimmedFileName;
        } catch (err) {
            console.error('Error processing the image:', err);
            throw err;
        }
    }
}



router.post('/register', helper.uploadImageFun.single('profile'), async (req, res, next) => {
    await trim(req);
    next();
}, customerController.addCustomer);



router.use(require('../middleware/tokenChecker'))



async function trimAttachments(req) {

    if (req.files && req.files.length > 0) {
        req.body.trimAttachments = [];

        for (let file of req.files) {
            const trimmedFileName = "trim_" + file.filename;
            const trimmedFilePath = path.join(file.destination, trimmedFileName);

            try {

                await sharp(file.path)
                    .resize(100)
                    .jpeg({ quality: 80 })
                    .toFile(trimmedFilePath);

                req.body.trimAttachments.push(trimmedFileName);
            } catch (err) {
                console.error('Error processing file:', err);
                throw err;
            }
        }
    } else if (req.file) {

        const trimmedFileName = "trim_" + req.file.filename;
        const trimmedFilePath = path.join(req.file.destination, trimmedFileName);

        try {
            await sharp(req.file.path)
                .resize(100)
                .jpeg({ quality: 80 })
                .toFile(trimmedFilePath);

            req.body.trimAttachments = trimmedFileName;
        } catch (err) {
            console.error('Error processing file:', err);
            throw err;
        }
    }
}



router.post('/proof/update',
    helper.uploadImageFun.single('attachments'),
    async (req, res, next) => {
        await trimAttachments(req);
        next();
    },
    proofController.updateProof
);




router.post('/proof/add',
    helper.uploadImageFun.array('attachments', 10), async (req, res, next) => {
        await trimAttachments(req);
        next();
    }, proofController.addProof
);




module.exports = router