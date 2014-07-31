var modelBuilder = require('../model-builder');
var Permissions = require('./permissions');

module.exports = modelBuilder.createModel('PermittedWorkspace', {
    workspaceId: {type: String},
    permissions: [Permissions]
});