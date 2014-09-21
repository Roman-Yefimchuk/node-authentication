"use strict";

angular.module('application')

    .controller('WorkspaceCreatorController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var onCreate = options.onCreate;
            var creatorModel = {
                workspaceName: 'New workspace',
                switchWorkspace: false
            };

            function createWorkspace() {
                var workspaceName = creatorModel.workspaceName;
                workspaceName = workspaceName.trim();

                if (workspaceName) {
                    onCreate(workspaceName, creatorModel.switchWorkspace, function () {
                        $modalInstance.close();
                    });
                }
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.creatorModel = creatorModel;

            $scope.createWorkspace = createWorkspace;
            $scope.cancel = cancel;
        }
    ]
);
