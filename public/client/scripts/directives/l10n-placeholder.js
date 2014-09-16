"use strict";

angular.module('application')

    .directive('l10nPlaceholder', [

        'translator',

        function (translator) {
            return {
                restrict: 'A',
                link: function (scope, element, attributes) {

                    var key = attributes['placeholderKey'];
                    var languageCode = attributes['placeholderLanguageCode'];

                    var translatedPlaceholderText = translator.translate(key, languageCode);
                    element.attr('placeholder', translatedPlaceholderText);

                    scope.$on('translator:onLanguageChanged', function () {
                        var translatedPlaceholderText = translator.translate(key, languageCode);
                        element.attr('placeholder', translatedPlaceholderText);
                    });
                }
            };
        }
    ]
);