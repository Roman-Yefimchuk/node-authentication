var dbHelper = require('../db-helper');

module.exports = dbHelper.createModel('UserAccount', {
    userId: {type: String},
    genericId: {type: String},
    displayName: {type: String},
    password: {type: String},
    email: {type: String},
    token: {type: String},
    authorizationProvider: {type: String},
    registeredDate: {type: Date, 'default': Date.now}
});
