"use strict";

angular.module('application')

    .directive('languageSwitcher', [

        '$rootScope',
        'translator',

        function ($rootScope, translator) {
            return {
                templateUrl: '/client/views/directives/language-switcher-view.html',
                controller: ['$scope', function ($scope) {
                    $scope.currentLanguageCode = translator.getCurrentLanguageCode();

                    $scope.languages = {
                        'en-us': {
                            enabledIcon: '/client/images/flags/us-enabled.png',
                            disabledIcon: '/client/images/flags/us-disabled.png',
                            translationKey: 'languages.en-us'
                        },
                        'ru': {
                            enabledIcon: '/client/images/flags/ru-enabled.png',
                            disabledIcon: '/client/images/flags/ru-disabled.png',
                            translationKey: 'languages.ru'
                        },
                        'uk': {
                            enabledIcon: '/client/images/flags/ua-enabled.png',
                            disabledIcon: '/client/images/flags/ua-disabled.png',
                            translationKey: 'languages.uk'
                        }
                    };

                    $scope.setLanguage = function (languageCode) {
                        $scope.currentLanguageCode = languageCode;
                        translator.setLanguage(languageCode);
                    };
                }]
            };
        }
    ]
);