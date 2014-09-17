"use strict";

angular.module('application')

    .filter("translate", [

        'translatorService',

        function (translatorService) {
            return function (key, languageCode) {
                return translatorService.translate(key, languageCode);
            }
        }
    ]);