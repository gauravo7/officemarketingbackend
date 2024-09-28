const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const dbPath = process.env.DBPATH || 'mongodb+srv://MOHIT-O7:mohit-o7@task-app.d4bte.mongodb.net/';

const mongo = mongoose.connect(dbPath); 

mongo.then(() => {
    console.log('DB Connected');
}, error => {
    console.log(error, 'error');
});

exports.isValid = function (id) {
    return mongoose.Types.ObjectId.isValid(id);
}
