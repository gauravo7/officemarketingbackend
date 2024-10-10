const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const transactionSchema = new Schema({
    transactionAutoId: { type: Number, default: 0 },

    transactionId: { type: String },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customer', },

    type: { type: String, required: true },

    accountDetails: { type: String },

    amount: { type: Number, required: true },

    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'task' },

    proofId: { type: mongoose.Schema.Types.ObjectId, ref: 'proof' },

    status: { type: Boolean, default: true },

    transactionStatus: { type: Number }, //'1=>pending' '2=>rejected' ,'3=>completed',

    paymentMethod: { type: String }, //'online', 'cash'

    remarks: { type: String },

    addedById: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

    isDelete: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },

    isBlocked: { type: Boolean, default: false },

    updatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
}, { timestamps: true });


module.exports = mongoose.model('transaction', transactionSchema);