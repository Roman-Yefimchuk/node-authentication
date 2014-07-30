var mongoose = require('mongoose');
var Schema = mongoose['Schema'];

var workspaceRelationSchema = new Schema({
    userId: {
        type: String
    },
    workspaceId: {
        type: String
    }
});

module.exports = mongoose.model('WorkspaceRelation', workspaceRelationSchema);