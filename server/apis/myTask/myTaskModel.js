const mongoose = require('mongoose');

var myTask = mongoose.Schema({
    autoId: { type: Number, default: 0 },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customer', default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'task', default: null },
    proofId: { type: mongoose.Schema.Types.ObjectId, ref: 'proof', default: null },

    isDelete: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    addedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    updatedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    status: { type: Boolean, default: true }
});

module.exports = mongoose.model('mytask', myTask);