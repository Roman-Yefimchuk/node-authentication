"use strict";

angular.module('application')

    .directive('languageSwitcher', [

        '$rootScope',
        'translatorService',

        function ($rootScope, translatorService) {
            return {
                templateUrl: '/client/views/directives/language-switcher-view.html',
                controller: ['$scope', function ($scope) {
                    $scope.currentLocaleCode = translatorService.getCurrentLocaleCode();

                    $scope.locales = {
                        'en-us': {
                            enabledIcon: '/client/images/flags/us-enabled.png',
                            disabledIcon: '/client/images/flags/us-disabled.png'
                        },
                        'ru': {
                            enabledIcon: '/client/images/flags/ru-enabled.png',
                            disabledIcon: '/client/images/flags/ru-disabled.png'
                        },
                        'uk': {
                            enabledIcon: '/client/images/flags/ua-enabled.png',
                            disabledIcon: '/client/images/flags/ua-disabled.png'
                        }
                    };

                    translatorService.onLocaleChanged($scope, function (localeCode) {
                        $scope.currentLocaleCode = localeCode;
                    });

                    $scope.setLocale = function (localeCode) {
                        if (localeCode != $scope.currentLocaleCode) {
                            translatorService.setLocale(localeCode);
                        }
                    };
                }]
            };
        }
    ]
);