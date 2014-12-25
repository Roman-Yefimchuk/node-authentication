"use strict";

(function (require) {

    var _ = require('underscore');

    var AuthenticateErrorCode = require('../../public/common-scripts/authenticate-error-codes');
    var AuthenticateException = require('../authenticate-exception');

    module.exports = function (dbProvider) {

        function signIn(profileId, handler) {
            dbProvider.findUser(profileId, {
                success: function (user) {
                    if (user) {
                        handler.success(user);
                    } else {
                        var authenticateException = new AuthenticateException(AuthenticateErrorCode.USER_NOT_FOUND);
                        handler.failure(authenticateException);
                    }
                },
                failure: function (error) {
                    handler.failure(error);
                }
            })
        }

        function signUp(provider, handler) {
            var profile = provider.profile;
            dbProvider.findUser(profile.genericId, {
                success: function (user) {
                    if (user) {
                        var authenticateException = new AuthenticateException(AuthenticateErrorCode.USER_ALREADY_EXISTS);
                        handler.failure(authenticateException);
                    } else {
                        dbProvider.createUser({
                            genericId: profile.genericId,
                            displayName: profile.displayName,
                            password: profile.password,
                            email: profile.email,
                            token: profile.token,
                            gender: profile.gender || 'not_defined',
                            avatarUrl: profile.avatarUrl,
                            registeredDate: _.now(),
                            authorizationProvider: provider.name
                        }, !!profile.email, handler);
                    }
                },
                failure: function (error) {
                    handler.failure(error);
                }
            })
        }

        return {
            signIn: signIn,
            signUp: signUp
        };
    };

})(require);