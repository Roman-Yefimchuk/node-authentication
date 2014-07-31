var modelBuilder = require('../model-builder');

module.exports = modelBuilder.createModel('Permissions', {
    readOnly: {type: Boolean},
    collectionManager: {type: Boolean},
    accessManager: {type: Boolean}
});