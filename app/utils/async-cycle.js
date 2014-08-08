"use strict";

module.exports = function (array, nextCallback, completedCallback) {
    var index = 0;
    var next = function () {
        if (index == array.length) {
            completedCallback();
        } else {
            var element = array[index];
            nextCallback(element, index, next);
            index++;
        }
    };

    next();
};