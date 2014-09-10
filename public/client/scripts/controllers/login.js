"use strict";

angular.module('application')

    .controller('LoginController', [

        '$scope',
        '$rootScope',
        '$location',
        'apiService',
        'loaderService',
        'DEBUG_MODE',
        'EMAIL_PATTERN',
        'PASSWORD_PATTERN',

        function ($scope, $rootScope, $location, apiService, loaderService, DEBUG_MODE, EMAIL_PATTERN, PASSWORD_PATTERN) {

            function getWorkspaceId() {
                if ($scope.currentWorkspace) {
                    return $scope.currentWorkspace['id'];
                }
            }

            function getRootWorkspaceId() {
                var activeNode = $scope.activeNode;
                if (activeNode) {
                    var activeRootNode = activeNode.getRoot();
                    var item = activeRootNode.item;
                    return item.id;
                }
            }

            $scope.isSystemEmpty = false;
            $scope.treeModel = [];
            $scope.errorMessage = null;
            $scope.currentWorkspace = undefined;
            $scope.email = "";
            $scope.password = "";
            $scope.workspaceDropdown = {
                isOpen: false
            };

            $scope.onWorkspaceChanged = function (node) {
                $scope.activeNode = node;
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

                    var ready = $scope.$on('workspaceTree[login-tree]:ready', function () {
                        $rootScope.$broadcast('workspaceTree[login-tree]:search', getWorkspaceId(), function (node) {
                            if (node) {
                                $scope.activeNode = node;
                                node.setActive();
                            }
                            loaderService.hideLoader();
                        });

                        ready();
                    });

                    $scope.treeModel = treeModel;

                } else {
                    $scope.errorMessage = 'System empty';
                    $scope.isSystemEmpty = true;
                    loaderService.hideLoader();
                }
            });

            $scope.isEmailValid = function () {
                var email = ($scope['email'] || '').toLowerCase();
                return EMAIL_PATTERN.test(email);
            };

            $scope.isPasswordValid = function () {
                var password = ($scope['password'] || '').toLowerCase();
                return PASSWORD_PATTERN.test(password);
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
                    workspaceId: getWorkspaceId(),
                    rootWorkspaceId: getRootWorkspaceId()
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
