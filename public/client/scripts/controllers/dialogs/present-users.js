"use strict";

angular.module('application')

    .controller('PresentUsersController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'options',

        function ($scope, $modalInstance, apiService, options) {

            var presentUsers = options.presentUsers;

            if (presentUsers.length > 0) {
                apiService.getUsers(presentUsers, function (users) {
                    $scope.presentUsers = users;
                });
            } else {
                $scope.presentUsers = [];
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }
    ]
);
