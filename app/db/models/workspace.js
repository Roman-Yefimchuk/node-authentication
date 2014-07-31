var modelBuilder = require('../model-builder');

module.exports = modelBuilder.createModel('Workspace', {
    name: {type: String},
    creatorId: {type: String}
});