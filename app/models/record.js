var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var recordSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    visited: {
        type: Number,
        default: 0
    }
}, {
    usePushEach: true
});

var recordListSchema = new Schema({
    sessionId: {
        type: String,
        required: true
    },
    list: [String],
    created: {
        type: Date,
        default: Date.now
    }
}, {
    usePushEach: true
});

module.exports = mongoose.model('Record', recordListSchema);