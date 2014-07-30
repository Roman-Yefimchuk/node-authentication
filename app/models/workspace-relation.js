var mongoose = require('mongoose');
var Schema = mongoose['Schema'];

var workspaceRelationSchema = new Schema({
    userId: {
        type: String
    },
    workspaceId: {
        type: String
    },
    permissions: {
        //read-only, collection-manager or access-manager
        //format: read-only|collection-manager|access-manager
        type: String
    }
});

module.exports = mongoose.model('WorkspaceRelation', workspaceRelationSchema);