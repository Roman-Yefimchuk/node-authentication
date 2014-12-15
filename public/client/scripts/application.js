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

            $routeProvider.when('/', {
                templateUrl: '/public/client/views/controllers/index-view.html',
                controller: 'IndexController',
                options: {
                    title: 'routes.index'
                }
            }).when('/login', {
                templateUrl: '/public/client/views/controllers/login-view.html',
                controller: 'LoginController',
                options: {
                    title: 'routes.login'
                }
            }).when('/sign-up', {
                templateUrl: '/public/client/views/controllers/sign-up-view.html',
                controller: 'SignUpController',
                options: {
                    title: 'routes.sign_up'
                }
            }).when('/home', {
                templateUrl: '/public/client/views/controllers/home/home-view.html',
                controller: 'HomeController',
                options: {
                    title: 'routes.home'
                }
            }).when('/profile', {
                templateUrl: '/public/client/views/controllers/profile-view.html',
                controller: 'ProfileController',
                options: {
                    title: 'routes.profile'
                }
            }).when('/settings', {
                templateUrl: '/public/client/views/controllers/settings-view.html',
                controller: 'SettingsController',
                options: {
                    title: 'routes.settings'
                }
            }).when('/lectures/administration/lecture-manager/:lectureId', {
                templateUrl: '/public/client/views/controllers/lectures/administration/lecture-manager/lecture-manager-view.html',
                controller: 'LectureManagerController',
                options: {
                    title: 'routes.lecture_manager'
                }
            }).when('/lectures/administration/question-manager/:questionId', {
                templateUrl: '/public/client/views/controllers/lectures/administration/question-manager-view.html',
                controller: 'QuestionManagerController',
                options: {
                    title: 'routes.question_manager'
                }
            }).when('/lectures/administration/lecture-statistic/:lectureId', {
                templateUrl: '/public/client/views/controllers/lectures/administration/lecture-statistic-view.html',
                controller: 'StatisticController',
                options: {
                    title: 'routes.lecture_statistic'
                }
            }).when('/lectures/lecture-board/:lectureId', {
                templateUrl: '/public/client/views/controllers/lectures/lecture-board/lecture-board-view.html',
                controller: 'LectureBoardController',
                options: {
                    title: 'routes.lecture_board'
                }
            }).when('/lectures/lecture-hall/:lectureId', {
                templateUrl: '/public/client/views/controllers/lectures/lecture-hall/lecture-hall-view.html',
                controller: 'LectureHallController',
                options: {
                    title: 'routes.lecture_hall'
                }
            }).when('/logout', {
                template: '',
                controller: 'LogoutController'
            }).otherwise({
                templateUrl: '/public/client/views/controllers/page-not-found-view.html',
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