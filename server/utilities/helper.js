const multer = require('multer');
const path = require('path');
const fs = require('fs');


let imageStorageFun = multer.diskStorage({
    destination: function (req, file, cb) {
        let fieldName = file.fieldname;
        let dir = path.join(__dirname, "../public", fieldName);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        let filename = Date.now() + path.extname(file.originalname);

        if (Array.isArray(req.body[file.fieldname])) {
            req.body[file.fieldname].push(filename);
        } else if (req.body[file.fieldname] !== undefined) {
         
            req.body[file.fieldname] = [req.body[file.fieldname], filename];
        } else {
           
            req.body[file.fieldname] = filename;
        }
        cb(null, filename);
    }
});

function unlinkImage(pic) {
    if (pic && pic.path) {
        fs.unlink(pic.path, (err) => {
            if (err) console.error(err);
        });
    }
}

let uploadImageFun = multer({
    storage: imageStorageFun
});




module.exports = {
    uploadImageFun,
    unlinkImage
};
