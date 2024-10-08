const sharp = require('sharp');

const router = require('express').Router()

const userController = require('../apis/user/userController')
const customerController = require('../apis/customer/customerController')
const roleAndPermissionController = require('../apis/roleAndPermission/roleAndPermissionController')
const categoryController = require('../apis/category/categoryController')
const taskController = require('../apis/task/taskController')
const proofController = require('../apis/proof/proofController')
const transactionController = require('../apis/transaction/transactionController')

/** AUTHENTICATION */
router.post('/login', userController.login)


router.use(require('../middleware/tokenChecker'))




router.post('/role/all', roleAndPermissionController.index)
router.post('/role/single', roleAndPermissionController.fetchRoleById)
router.post('/role/add', roleAndPermissionController.addRole)
router.post('/role/update', roleAndPermissionController.updateRole)
router.delete('/role/delete', roleAndPermissionController.deleteRole)



/** User Routes */

router.post('/user/all', userController.index)
router.post('/user/single', userController.fetchUserById)
router.delete('/user/delete', userController.deleteUser)
router.post('/user/update', userController.updateUser)

/** User Routes Ends */



/** customers Routes */

router.post('/customer/all', customerController.index)
router.post('/customer/single', customerController.fetchCustomerById)
router.post('/customer/category/assign', customerController.assignCategory)


/** customers Routes Ends*/


router.post('/category/all', categoryController.index)
router.post('/category/single', categoryController.fetchCategoryById)
router.post('/category/add', categoryController.addCategory)
router.post('/category/update', categoryController.updateCategory)
router.delete('/category/delete', categoryController.deleteCategory)

// Products
router.post('/task/add', taskController.addTask)
router.post('/task/all', taskController.index)
router.post('/task/single', taskController.fetchTaskById)
router.post('/task/update', taskController.updateTask)
router.delete('/task/delete', taskController.deleteTask)




// Proof
router.post('/proof/verify', proofController.verifyProof)
router.post('/proof/all', proofController.index)
router.post('/proof/single', proofController.fetchProofById)
router.delete('/proof/delete', proofController.deleteProof)




// Transactions

router.post('/transaction/all', transactionController.index)
router.post('/transaction/single', transactionController.fetchTransactionById)
router.post('/transaction/create', transactionController.createTransaction)


router.all("*", (req, res) => {
    res.send({
        success: false,
        status: 404,
        message: "Route Not Found"

    })

})


module.exports = router