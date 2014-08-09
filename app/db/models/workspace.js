"use strict";

var dbHelper = require('../db-helper');

module.exports = dbHelper.createModel('Workspace', {
    name: {type: String},
    creatorId: {type: String},
    createdDate: {type: Number, 'default': Date.now}
});