"use strict";

angular.module('application')

    .filter("translate", [

        'translator',

        function (translator) {
            return function (key, languageCode) {
                return translator.translate(key, languageCode);
            }
        }
    ]);