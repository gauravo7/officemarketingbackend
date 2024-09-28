const mongoose = require('mongoose')

var roleSchema = mongoose.Schema({
    roleAutoId: { type: Number, default: 0 },
    name: { type: String, default: '' },
    permissions: [{ type: String, default: '' }],

    isDelete: { type: Boolean, default: false },

    addedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    updatedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    status: { type: Boolean, default: true }


})
module.exports = mongoose.model('role', roleSchema)
