"use strict";

angular.module('application')

    .directive('l10n', [

        'translator',

        function (translator) {
            return {
                restrict: 'E',
                link: function (scope, element, attributes) {

                    var key = attributes['key'];
                    var languageCode = attributes['languageCode'];

                    var translatedText = translator.translate(key, languageCode);
                    element.text(translatedText);

                    scope.$on('translator:onLanguageChanged', function () {
                        var translatedText = translator.translate(key, languageCode);
                        element.text(translatedText);
                    });
                }
            };
        }
    ]
);