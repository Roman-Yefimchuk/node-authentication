var dbHelper = require('../db-helper');

module.exports = dbHelper.createModel('PermittedWorkspace', {
    workspaceId: {type: String},
    isOwn: {type: Boolean, 'default': false},
    permissions: {
        readOnly: {type: Boolean},
        collectionManager: {type: Boolean},
        accessManager: {type: Boolean}
    }
});