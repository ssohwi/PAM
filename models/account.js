const mongoose = require('mongoose');

const { Schema } = mongoose;
// 생성자
const Account = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    super: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

module.exports = mongoose.model('Account', Account);