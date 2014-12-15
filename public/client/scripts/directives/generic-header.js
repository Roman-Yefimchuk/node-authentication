"use strict";

angular.module('application')

    .directive('genericHeader', [

        'apiService',
        'dialogsService',

        function (apiService, dialogsService) {
            return {
                scope: {
                    user: '=',
                    backLink: '@'
                },
                templateUrl: '/public/client/views/directives/generic-header-view.html',
                controller: ['$scope', function ($scope) {
                }]
            };
        }
    ]);