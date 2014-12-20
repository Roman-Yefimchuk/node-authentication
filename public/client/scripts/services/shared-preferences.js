'use strict';

angular.module('application')

    .service('sharedPreferencesService', [

        '$cookieStore',

        function ($cookieStore) {

            var SharedPreferences = (function () {

                var PreferencesEditor = (function () {

                    function PreferencesEditor(keys, sharedPreferences, commitCallback) {
                        this.keys = keys;
                        this.preferences = angular.copy(sharedPreferences);
                        this.commitCallback = commitCallback;
                    }

                    PreferencesEditor.prototype = {
                        put: function (key, value) {

                            var keys = this.keys;
                            var preferences = this.preferences;

                            if (_.contains(keys, key)) {
                                preferences[key] = value;
                            }
                        },
                        remove: function (key) {

                            var keys = this.keys;
                            var preferences = this.preferences;

                            if (_.contains(keys, key)) {
                                delete preferences[key];
                            }
                        },
                        removeAll: function () {
                            this.preferences = {};
                        },
                        commit: function () {

                            var keys = this.keys;
                            var preferences = this.preferences;

                            _.forEach(keys, function (key) {
                                if (preferences[key]) {
                                    $cookieStore.put(key, preferences[key]);
                                } else {
                                    $cookieStore.remove(key);
                                }
                            });

                            var commitCallback = this.commitCallback;
                            commitCallback(preferences);
                        }
                    };

                    return PreferencesEditor;
                })();

                function SharedPreferences(keys) {

                    var sharedPreferences = {};

                    _.forEach(keys, function (key) {
                        sharedPreferences[key] = $cookieStore.get(key);
                    });

                    this.keys = keys;
                    this.sharedPreferences = sharedPreferences;
                }

                SharedPreferences.prototype = {
                    edit: function () {

                        var context = this;
                        var keys = this.keys;
                        var sharedPreferences = this.sharedPreferences;

                        return new PreferencesEditor(keys, sharedPreferences, function (sharedPreferences) {
                            context.sharedPreferences = sharedPreferences;
                        });
                    },
                    get: function (key) {
                        return this.sharedPreferences[key];
                    }
                };

                return SharedPreferences;

            })();

            return {
                getSharedPreferences: function (keys) {
                    return new SharedPreferences(keys);
                }
            };
        }
    ]
);
