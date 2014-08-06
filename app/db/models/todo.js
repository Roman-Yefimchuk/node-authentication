var dbHelper = require('../db-helper');

module.exports = dbHelper.createModel('Todo', {
    creatorId: {type: String},
    title: {type: String},
    completed: {type: Boolean},
    workspaceId: {type: String},
    createdDate: {type: Date, 'default': Date.now}
});