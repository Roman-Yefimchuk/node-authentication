"use strict";

angular.module('application', [

    'ui.bootstrap',
    'ngRoute',
    'ngSanitize',
    'ngCookies'

])
    .config([

        '$routeProvider',
        '$locationProvider',
        '$httpProvider',
        '$logProvider',
        '$tooltipProvider',
        'DEBUG_MODE',

        function ($routeProvider, $locationProvider, $httpProvider, $logProvider, $tooltipProvider, DEBUG_MODE) {

            $tooltipProvider.options({
                placement: 'top',
                animation: true,
                popupDelay: 500,
                appendToBody: true
            });

            $logProvider.debugEnabled(DEBUG_MODE);

            if (DEBUG_MODE) {
                //TODO: debug mode
                window.onerror = function (message, file) {
                    alert(message);
                    alert(file);
                };
            }

            $routeProvider.when('/', {
                templateUrl: '/client/views/controllers/index-view.html',
                controller: 'IndexController',
                options: {
                    title: 'routes.index'
                }
            }).when('/login', {
                templateUrl: '/client/views/controllers/login-view.html',
                controller: 'LoginController',
                options: {
                    title: 'routes.login'
                }
            }).when('/sign-up', {
                templateUrl: '/client/views/controllers/sign-up-view.html',
                controller: 'SignUpController',
                options: {
                    title: 'routes.sign_up'
                }
            }).when('/home', {
                templateUrl: '/client/views/controllers/home/home-view.html',
                controller: 'HomeController',
                options: {
                    title: 'routes.home'
                }
            }).when('/profile', {
                templateUrl: '/client/views/controllers/profile-view.html',
                controller: 'ProfileController',
                options: {
                    title: 'routes.profile'
                }
            }).when('/settings', {
                templateUrl: '/client/views/controllers/settings-view.html',
                controller: 'SettingsController',
                options: {
                    title: 'routes.settings'
                }
            }).when('/logout', {
                template: '',
                controller: 'LogoutController'
            }).otherwise({
                templateUrl: '/client/views/controllers/page-not-found-view.html',
                controller: 'NotFoundController',
                options: {
                    title: function (currentPath, translatorService) {
                        return translatorService.format('routes.page_not_found', {
                            page: currentPath
                        });
                    }
                }
            });
        }
    ])

    .run([

        '$rootScope',
        '$location',
        '$document',
        'translatorService',
        'en-US',
        'ru-RU',
        'uk-UA',

        function ($rootScope, $location, $document, translatorService, enUS, ruRU, ukUA) {

            _.forEach({
                'en-us': enUS,
                'ru': ruRU,
                'uk': ukUA
            }, function (localeData, localeCode) {
                translatorService.addLocale(localeCode, localeData);
            });

            var routes = {};

            function updatePageTitle(title) {
                if (title) {
                    if (typeof title == 'function') {
                        var currentPath = $location.path();
                        title = title(currentPath, translatorService);
                        if (title) {
                            $document.attr('title', title);
                        }
                    } else {
                        title = translatorService.translate(title);
                        $document.attr('title', title);
                    }
                }
            }

            translatorService.onLocaleChanged($rootScope, function () {
                var title = routes[$location.path()];
                updatePageTitle(title);
            });

            $rootScope.$on('$routeChangeStart', function (event, nextRoute, currentRoute) {
            });

            $rootScope.$on('$routeChangeSuccess', function (event, currentRoute, prevRoute) {
                var options = currentRoute['options'];
                if (options) {
                    var title = options['title'];
                    routes[$location.path()] = title;
                    updatePageTitle(title);
                }
            });
        }
    ]);