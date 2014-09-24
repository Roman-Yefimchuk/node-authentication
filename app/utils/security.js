"use strict";

(function (require) {

    var bCrypt = require('bcrypt-nodejs');

    module.exports = {
        generateHash: function (password) {
            return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        },
        validPassword: function (userAccount, password) {
            var userEncryptedPassword = userAccount.password;
            return bCrypt.compareSync(password, userEncryptedPassword);
        },
        decodeBase64: function (encoded) {
            return new Buffer(encoded || '', 'base64').toString('utf8');
        },
        encodeBase64: function (unencoded) {
            return new Buffer(unencoded || '').toString('base64');
        },
        randomString: ((function () {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

            return function (length) {
                if (!length) {
                    length = 64;
                }

                var result = '';
                for (var index = 0; index < length; index++) {
                    var charIndex = Math.floor(Math.random() * chars.length);
                    result += chars[charIndex];
                }
                return result;
            }
        })())
    };
})(require);