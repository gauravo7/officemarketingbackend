const mongoose = require('mongoose');


var proofSchema = mongoose.Schema({
    proofAutoId: { type: Number, default: 0 },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'task', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    attachments: [{ type: String, required: false }],
    trimAttachments: [{ type: String, required: false }],
    comments: [
        {
            comment: { type: String },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    hasVerified: { type: Boolean, default: false },
    submissionStatus: { type: Number, default: 1 }, // 1 - submmitted , 2- VerificationInProgress,3-Resubmission,4-Closed
    isPaid: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    addedById: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    updatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    updatedAt: { type: Date, default: null },
    status: { type: Boolean, default: true }
});



module.exports = mongoose.model('proof', proofSchema);
