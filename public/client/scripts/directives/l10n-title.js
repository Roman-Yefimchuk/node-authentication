"use strict";

angular.module('application')

    .directive('l10nTitle', [

        'translator',

        function (translator) {
            return {
                restrict: 'A',
                link: function (scope, element, attributes) {

                    var key = attributes['titleKey'];
                    var languageCode = attributes['titleLanguageCode'];

                    var translatedPlaceholderText = translator.translate(key, languageCode);
                    element.attr('title', translatedPlaceholderText);

                    scope.$on('translator:onLanguageChanged', function () {
                        var translatedPlaceholderText = translator.translate(key, languageCode);
                        element.attr('title', translatedPlaceholderText);
                    });
                }
            };
        }
    ]
);