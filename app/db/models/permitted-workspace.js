var dbHelper = require('../db-helper');
var Permissions = require('./permissions');

module.exports = dbHelper.createModel('PermittedWorkspace', {
    workspaceId: {type: String},
    permissions: {
        readOnly: {type: Boolean},
        collectionManager: {type: Boolean},
        accessManager: {type: Boolean}
    }
});