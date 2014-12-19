"use strict";

(function (require) {

    var BCrypt = require('bcrypt-nodejs');

    function generateHash(password) {
        return BCrypt.hashSync(password, BCrypt.genSaltSync(8), null);
    }

    function validPassword(userAccount, password) {
        var userEncryptedPassword = userAccount.password;
        return BCrypt.compareSync(password, userEncryptedPassword);
    }

    function decodeBase64(encoded) {
        return new Buffer(encoded || '', 'base64').toString('utf8');
    }

    function encodeBase64(unencoded) {
        return new Buffer(unencoded || '').toString('base64');
    }

    function randomString(length) {

        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

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

    module.exports = {
        generateHash: generateHash,
        validPassword: validPassword,
        decodeBase64: decodeBase64,
        encodeBase64: encodeBase64,
        randomString: randomString
    };
})(require);