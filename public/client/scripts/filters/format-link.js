"use strict";

angular.module('application')

    .filter("formatLink", [

        function () {
            return function (link) {

                if (link.startWith('http://') || link.startWith('https://')) {
                    return link;
                }

                return 'http://' + link;
            };
        }
    ]);