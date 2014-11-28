"use strict";

angular.module('application')

    .directive('languageSwitcher', [

        '$rootScope',
        'translatorService',

        function ($rootScope, translatorService) {
            return {
                templateUrl: '/public/client/views/directives/language-switcher-view.html',
                controller: ['$scope', function ($scope) {

                    function setLocale(localeCode) {
                        if (localeCode != $scope.currentLocaleCode) {
                            translatorService.setLocale(localeCode);
                        }
                    }

                    $scope.currentLocaleCode = translatorService.getCurrentLocaleCode();
                    $scope.locales = {
                        'en-us': {
                            enabledIcon: '/public/client/images/flags/us-enabled.png',
                            disabledIcon: '/public/client/images/flags/us-disabled.png'
                        },
                        'ru': {
                            enabledIcon: '/public/client/images/flags/ru-enabled.png',
                            disabledIcon: '/public/client/images/flags/ru-disabled.png'
                        },
                        'uk': {
                            enabledIcon: '/public/client/images/flags/ua-enabled.png',
                            disabledIcon: '/public/client/images/flags/ua-disabled.png'
                        }
                    };

                    $scope.setLocale = setLocale;

                    translatorService.onLocaleChanged($scope, function (localeCode) {
                        $scope.currentLocaleCode = localeCode;
                    });
                }]
            };
        }
    ]
);