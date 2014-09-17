"use strict";

angular.module('application')

    .directive('l10n', [

        'translatorService',

        function (translatorService) {

            var each = function (collection, iterator) {
                for (var index = 0; index < collection.length; index++) {
                    iterator(collection[index]);
                }
            };

            function splitAttributesList(attributesList) {
                if (attributesList) {
                    if (attributesList.indexOf('|') != -1) {
                        return attributesList.split('|');
                    }
                    return [attributesList];
                }
                return [];
            }

            return {
                restrict: 'AE',
                link: function (scope, element, attributes) {

                    var attributesList = splitAttributesList(attributes['l10n']);

                    if (attributesList.length > 0) {

                        each(attributesList, function (attribute) {

                            var key = attributes[attribute + 'Key'];
                            var localeCode = attributes[attribute + 'LocaleCode'];

                            switch (attribute) {
                                case 'text':
                                {
                                    var translatedText = translatorService.translate(key, localeCode);
                                    element.text(translatedText);

                                    translatorService.onLocaleChanged(scope, function () {
                                        var translatedText = translatorService.translate(key, localeCode);
                                        element.text(translatedText);
                                    });
                                    break;
                                }
                                case 'html':
                                {
                                    var translatedHtml = translatorService.translate(key, localeCode);
                                    element.html(translatedHtml);

                                    translatorService.onLocaleChanged(scope, function () {
                                        var translatedHtml = translatorService.translate(key, localeCode);
                                        element.html(translatedHtml);
                                    });
                                    break;
                                }
                                default :
                                {
                                    var translatedAttribute = translatorService.translate(key, localeCode);
                                    element.attr(attribute, translatedAttribute);

                                    translatorService.onLocaleChanged(scope, function () {
                                        var translatedAttribute = translatorService.translate(key, localeCode);
                                        element.attr(attribute, translatedAttribute);
                                    });
                                    break;
                                }
                            }
                        });
                    } else {

                        var key = attributes['key'];
                        var localeCode = attributes['localeCode'];

                        var translatedText = translatorService.translate(key, localeCode);
                        element.text(translatedText);

                        translatorService.onLocaleChanged(scope, function () {
                            var translatedText = translatorService.translate(key, localeCode);
                            element.text(translatedText);
                        });
                    }
                }
            };
        }
    ]
);