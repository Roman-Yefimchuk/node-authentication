var dbHelper = require('../db-helper');

module.exports = dbHelper.createModel('Workspace', {
    name: {type: String},
    creatorId: {type: String},
    created: {type: Date, 'default': Date.now}
});