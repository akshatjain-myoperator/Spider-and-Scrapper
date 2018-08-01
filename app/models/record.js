var mongoose = require('mongoose');

var Schema = mongoose.Schema;

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