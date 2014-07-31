var modelBuilder = require('../model-builder');

module.exports = modelBuilder.createModel('Todo', {
    userId: {type: String},
    title: {type: String},
    completed: {type: Boolean},
    workspaceId: {type: String}
});