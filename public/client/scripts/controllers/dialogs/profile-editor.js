"use strict";

angular.module('application')

    .controller('ProfileEditorDialogController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var userProfile = options.userProfile;
            var onSave = options.onSave || function (closeCallback) {
                closeCallback();
            };

            function save() {
                onSave($scope.userProfile, function () {
                    $modalInstance.close();
                });
            }

            function cancel() {
                $modalInstance.close();
            }

            function isDisabled() {
                return angular.equals($scope.userProfile, userProfile) && (function () {
                    var userProfile = $scope.userProfile;
                    for (var key in userProfile) {
                        if (!userProfile[key]) {
                            return false;
                        }
                    }
                    return true;
                })();
            }

            $scope.userProfile = angular.copy(userProfile);

            $scope.save = save;
            $scope.cancel = cancel;
            $scope.isDisabled = isDisabled;
        }
    ]
);
