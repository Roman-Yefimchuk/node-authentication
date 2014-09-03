'use strict';

angular.module('application')

    .factory('actionFactory', [

        function () {

            var events = {};

            return {
                on: function (actionName, callback) {
                    var list = events[actionName] || [];

                    var index = list.length;
                    if (index != 0) {
                        index--;
                    }

                    list.push(callback);

                    events[actionName] = list;

                    return function () {
                        list.splice(index, 1);
                    };
                },
                emit: function (actionName, options, context) {
                    _.forEach(events[actionName] || [], function (callback) {
                        callback.call(context || this, options);
                    })
                }
            };
        }
    ]
);