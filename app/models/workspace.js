var mongoose = require('mongoose');
var Schema = mongoose['Schema'];

var workspaceSchema = new Schema({
    name: {
        type: String
    },
    creatorId: {
        type: String
    }
});

module.exports = mongoose.model('Workspace', workspaceSchema);