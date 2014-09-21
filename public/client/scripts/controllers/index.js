"use strict";

angular.module('application')

    .controller('IndexController', [

        '$scope',
        '$rootScope',
        '$timeout',
        'loaderService',

        function ($scope, $rootScope, $timeout, loaderService) {

            function showLoader() {
                loaderService.showLoader();
            }

            $scope.redirectReason = null;

            var removeRedirectEvent = $rootScope.$on('indexController:redirect', function (event, data) {
                $timeout(function () {
                    $scope.redirectReason = data['redirectReason'];
                });
            });

            $scope.$on('$destroy', function () {
                removeRedirectEvent();
            });

            $scope.showLoader = showLoader;
        }
    ]
);
