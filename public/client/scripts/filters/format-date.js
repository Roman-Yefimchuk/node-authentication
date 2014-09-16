"use strict";

angular.module('application')

    .filter("formatDate", [
        function () {
            return function (timestamp, mask) {
                var date = new Date(timestamp);
                if (mask) {
                    return date.format(mask);
                }
                return date.toString();
            };
        }
    ]);