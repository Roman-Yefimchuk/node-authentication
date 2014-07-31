var bcrypt = require('bcrypt-nodejs');
var modelBuilder = require('../model-builder');

var Workspace = require('./workspace');
var Permissions = require('./permissions');
var PermittedWorkspace = require('./permitted-workspace');

module.exports = modelBuilder.createModel('User', {
    local: {
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
    ownWorkspaces: {
        type: [
            {type: String}
        ]
    },
    permittedWorkspaces: {
        type: [
            {type: PermittedWorkspace}
        ]
    }
}, function (schema) {
    schema.methods.generateHash = function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    schema.methods.validPassword = function (password) {
        return bcrypt.compareSync(password, this.local.password);
    };
});
