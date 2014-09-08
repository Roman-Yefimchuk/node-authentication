"use strict";

angular.module('application')

    .controller('WorkspaceCreatorController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var onCreate = options.onCreate;

            $scope.creatorModel = {
                workspaceName: 'New workspace',
                switchWorkspace: false
            };

            $scope.createWorkspace = function () {
                var workspaceName = $scope.creatorModel['workspaceName'];
                workspaceName = workspaceName.trim();

                if (workspaceName) {
                    onCreate(workspaceName, $scope.creatorModel['switchWorkspace'], function () {
                        $modalInstance.close();
                    });
                }
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }
    ]
);
