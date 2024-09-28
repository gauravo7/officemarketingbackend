const mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
    taskAutoId: { type: Number, default: 0 },
    title: { type: String, required: true },
    description: { type: String, default: 'No description' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', default: null },
    price: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    isDelete: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    addedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    updatedById: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    status: { type: Boolean, default: true }
});

module.exports = mongoose.model('task', taskSchema);
