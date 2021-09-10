const mongoose = require('mongoose');

const { Schema } = mongoose;
// 생성자
const Trash = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    entryId: {
        type: Number,
        required: true,
        unique: true,
    },
    can: {
        type: Number,
        default: false,
    },
    glass: {
        type: Number,
        default: false,
    },
    plastic: {
        type: Number,
        required: false,
    },
    total: {
        type: Number,
        required: false,
    },
    createdAt: {
        type: Date,
    },
});

module.exports = mongoose.model('Trash', Trash);