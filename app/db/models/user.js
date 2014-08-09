"use strict";

var bcrypt = require('bcrypt-nodejs');
var dbHelper = require('../db-helper');

var Workspace = require('./workspace');
var PermittedWorkspace = require('./permitted-workspace');

module.exports = dbHelper.createModel('User', {
    accountId: {type: String},
    currentWorkspaceId: {type: String},
    ownWorkspaces: [String],
    permittedWorkspaces: [PermittedWorkspace['schema']]
});
