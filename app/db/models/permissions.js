var dbHelper = require('../db-helper');

module.exports = dbHelper.createModel('Permissions', {
    readOnly: {type: Boolean},
    collectionManager: {type: Boolean},
    accessManager: {type: Boolean}
});