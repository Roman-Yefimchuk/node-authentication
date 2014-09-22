"use strict";

module.exports = function (obj, nextCallback, completedCallback) {

    if (obj) {

        if (obj instanceof Array) {

            var index = 0;
            var interrupt = function () {
                index = obj.length;
                next();
            };
            var next = function () {

                if (index == obj.length) {
                    completedCallback();
                } else {
                    var element = obj[index];
                    nextCallback(element, index++, next, interrupt);
                }
            };

            next();
        } else {

            var keys = _.keys(obj);
            var index = 0;
            var interrupt = function () {
                index = keys.length;
                next();
            };
            var next = function () {

                if (index == keys.length) {
                    completedCallback();
                } else {
                    var key = keys[index++];
                    var element = obj[key];
                    nextCallback(element, key, next, interrupt);
                }
            };

            next();
        }
    } else {
        completedCallback();
    }
};