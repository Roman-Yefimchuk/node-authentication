"use strict";

angular.module('application')

    .controller('LoginController', [

        '$scope',
        '$rootScope',
        '$location',
        'apiService',
        'loaderService',
        'DEBUG_MODE',

        function ($scope, $rootScope, $location, apiService, loaderService, DEBUG_MODE) {

            function getWorkspaceId() {
                if ($scope.currentWorkspace) {
                    return $scope.currentWorkspace['id'];
                }
            }

            $scope.onWorkspaceChanged = function (node) {
                $scope.currentWorkspace = node.item['workspace'];
                $scope.workspaceDropdown['isOpen'] = false;
            };

            $scope.onWorkspaceLoading = function (item, callback) {
                var workspace = item.workspace;
                apiService.getAllWorkspaces(workspace.id, function (data) {
                    callback(data, function (workspace) {
                        return {
                            name: workspace.name,
                            id: workspace.id,
                            workspace: workspace,
                            childrenCount: workspace.childrenCount,
                            children: []
                        };
                    });
                });
            };

            var emailPattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
            var passwordPattern = /^(([a-z]|[A-Z]|[0-9]|\u005F)+){6}$/;

            $scope.treeModel = [];

            $scope.errorMessage = null;

            $scope.currentWorkspace = undefined;

            loaderService.showLoader();

            apiService.getAllWorkspaces(getWorkspaceId(), function (workspaces) {
                if (workspaces.length > 0) {
                    $scope.currentWorkspace = workspaces[0];

                    var treeModel = [];

                    _.forEach(workspaces, function (workspace) {
                        treeModel.push({
                            name: workspace.name,
                            id: workspace.id,
                            childrenCount: workspace.childrenCount,
                            workspace: workspace,
                            children: []
                        });
                    });

                    $scope.treeModel = treeModel;

                } else {
                    $scope.errorMessage = 'System empty';
                }

                var ready = $scope.$on('workspaceTree[login-tree]:ready', function () {
                    $rootScope.$broadcast('workspaceTree[login-tree]:search', getWorkspaceId(), function (node) {
                        if (node) {
                            node.setActive();
                        }
                        loaderService.hideLoader();
                    });

                    ready();
                });
            });

            $scope.workspaceDropdown = {
                isOpen: false
            };

            $scope.email = "";
            $scope.password = "";

            $scope.isEmailValid = function () {
                return emailPattern.test($scope['email']);
            };

            $scope.isPasswordValid = function () {
                return passwordPattern.test($scope['password']);
            };

            $scope.quickLogin = function () {
                if (DEBUG_MODE) {
                    $scope.email = 'roman@gmail.com';
                    $scope.password = 'qwerty';

                    $scope.$watch('email', function () {
                        $scope.login();
                    });
                }
            };

            $scope.login = function () {

                loaderService.showLoader();

                apiService.login({
                    email: $scope.email,
                    password: $scope.password,
                    workspaceId: getWorkspaceId()
                }, {
                    success: function () {
                        $location.path('/home');
                    },
                    failure: function (error) {
                        $scope.errorMessage = error.message;
                        loaderService.hideLoader();
                    }
                });
            };
        }
    ]
);
