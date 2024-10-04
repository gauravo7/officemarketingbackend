const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    transactionAutoId: { type: Number, default: 0 },
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true
    },
    type: {
        type: String, required: true
    },
    amount: {
        type: Number, required: true
    },
 
    taskId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'task'
    },
    proofId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'proof'
    },
    status: {
        type: Boolean, default: true
    },
    remarks: {
        type: String,
    },
    addedById: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user'
    },
    isDelete: {
        type: Boolean, default: false
    },
    createdAt: {
        type: Date, default: Date.now
    },
    isBlocked: {
        type: Boolean, default: false
    },
    updatedById: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user'
    }
}, { timestamps: true });

module.exports = mongoose.model('transaction', transactionSchema);
