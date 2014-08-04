var bcrypt = require('bcrypt-nodejs');
var dbHelper = require('../db-helper');

var Workspace = require('./workspace');
var PermittedWorkspace = require('./permitted-workspace');

module.exports = dbHelper.createModel('User', {
    local: {
        name: {type: String},
        email: {type: String},
        password: {type: String}
    },
    facebook: {
        id: {type: String},
        token: {type: String},
        email: {type: String},
        name: {type: String}
    },
    twitter: {
        id: {type: String},
        token: {type: String},
        displayName: {type: String},
        username: {type: String}
    },
    google: {
        id: {type: String},
        token: {type: String},
        email: {type: String},
        name: {type: String}
    },
    currentWorkspaceId: {type: String},
    ownWorkspaces: [String],
    permittedWorkspaces: [PermittedWorkspace['schema']],
    registeredDate: {type: Date, 'default': Date.now}
}, function (schema) {
    schema.methods.generateHash = function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    schema.methods.validPassword = function (password) {
        return bcrypt.compareSync(password, this.local.password);
    };
});
