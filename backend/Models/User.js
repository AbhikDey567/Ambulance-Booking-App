const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true, // removes extra spaces
    },
    email: {
        type: String,
        required: true,
        unique: true, // ensures no duplicate emails
        lowercase: true // store all emails lowercase
    },
    phone: {
        type: String,
        required: false, // optional field (since 2nd model had it but not enforced)
        trim: true
    },
    password: {
        type: String,
        required: true,
    }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
