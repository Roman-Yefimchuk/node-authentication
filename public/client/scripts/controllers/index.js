"use strict";

angular.module('application')

    .controller('IndexController', [

        '$scope',
        '$rootScope',
        '$timeout',
        'loaderService',

        function ($scope, $rootScope, $timeout, loaderService) {

            $scope.showLoader = function () {
                loaderService.showLoader();
            };

            $scope.redirectReason = null;

            $rootScope.$on('indexController:redirect', function (event, data) {
                $timeout(function () {
                    $scope.redirectReason = data['redirectReason'];
                });
            });
        }
    ]
);
