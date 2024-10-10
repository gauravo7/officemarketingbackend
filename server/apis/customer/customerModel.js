const mongoose = require('mongoose');

var customerSchema = mongoose.Schema({
    customerAutoId: { type: Number, default: 0 },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    profile: { type: String, default: '' },
    trimProfile: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    userType: { type: Number, default: 2 },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    pendingRequests: { type: Number, default: 0 },
    level: { type: Number, default: 1, },
    addedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    userId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    updatedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    isDelete: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    status: { type: Boolean, default: true }

});

module.exports = mongoose.model('customer', customerSchema);