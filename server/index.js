const express = require("express")
const compression = require('compression')
const app = express()
const cors = require('cors')
app.use(cors())
require("dotenv").config()
const mongoose = require('./config/db');
app.use(express.static('server/public/'))

require('./config/seed').createAdmin()
const adminRoutes = require('./routes/adminRoutes')
const customerRoutes = require('./routes/customerRoutes')
const errorHandler = require('./middleware/responseHandler')
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false, parameterLimit: 500000000 }));



const port = process.env.PORT || 4100



app.use('/admin', adminRoutes)
app.use('/customer', customerRoutes)
app.use(compression())

app.get('/', (req, res) => {
    res.send('Welcome to the Server ');
});



app.use(errorHandler)

app.listen(port, (err) => {
    if (err) {
        console.log("error in server", err);


    }
    else {
        console.log(`Server listening on port ${port}!`);
    }

})



