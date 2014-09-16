"use strict";

angular.module('application', [

    'ui.bootstrap',
    'ngRoute',
    'ngSanitize'

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
                    title: 'Index'
                }
            }).when('/login', {
                templateUrl: '/client/views/controllers/login-view.html',
                controller: 'LoginController',
                options: {
                    title: 'Login'
                }
            }).when('/sign-up', {
                templateUrl: '/client/views/controllers/sign-up-view.html',
                controller: 'SignUpController',
                options: {
                    title: 'Sign up'
                }
            }).when('/home', {
                templateUrl: '/client/views/controllers/home-view.html',
                controller: 'HomeController',
                options: {
                    title: 'Home'
                }
            }).when('/profile', {
                templateUrl: '/client/views/controllers/profile-view.html',
                controller: 'ProfileController',
                options: {
                    title: 'Profile'
                }
            }).when('/settings', {
                templateUrl: '/client/views/controllers/settings-view.html',
                controller: 'SettingsController',
                options: {
                    title: 'Settings'
                }
            }).when('/logout', {
                template: '',
                controller: 'LogoutController'
            }).otherwise({
                templateUrl: '/client/views/controllers/page-not-found-view.html',
                controller: 'NotFoundController',
                options: {
                    title: function (currentPath) {
                        return "Page '" + currentPath + "' not found";
                    }
                }
            });
        }
    ])

    .run([

        '$rootScope',
        '$location',
        '$document',
        'translator',
        'en-US',
        'ru-RU',
        'uk-UA',

        function ($rootScope, $location, $document, translator, enUS, ruRU, ukUA) {

            translator.addLanguage('en-us', enUS);
            translator.addLanguage('ru', ruRU);
            translator.addLanguage('uk', ukUA);

            $rootScope.$on('$routeChangeStart', function (event, nextRoute, currentRoute) {
            });

            $rootScope.$on('$routeChangeSuccess', function (event, currentRoute, prevRoute) {
                var options = currentRoute['options'];
                if (options) {
                    var title = options['title'];
                    if (title) {
                        if (typeof title == 'function') {
                            var currentPath = $location.path();
                            title = title(currentPath);
                            if (title) {
                                $document.attr('title', title);
                            }
                        } else {
                            $document.attr('title', title);
                        }
                    }
                }
            });
        }
    ]);