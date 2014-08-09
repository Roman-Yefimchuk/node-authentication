"use strict";

var bcrypt = require('bcrypt-nodejs');

module.exports = {
    generateHash: function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },
    validPassword: function (userAccount, password) {
        var userEncryptedPassword = userAccount.password;
        return bcrypt.compareSync(password, userEncryptedPassword);
    }
};
