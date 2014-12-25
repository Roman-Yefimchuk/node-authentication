"use strict";

angular.module('application')

    .controller('SignInController', [

        '$scope',
        '$rootScope',
        '$location',
        '$routeParams',
        'apiService',
        'loaderService',
        'translatorService',
        'DEBUG_MODE',
        'EMAIL_PATTERN',
        'PASSWORD_PATTERN',

        function ($scope, $rootScope, $location, $routeParams, apiService, loaderService, translatorService, DEBUG_MODE, EMAIL_PATTERN, PASSWORD_PATTERN) {

            var loginTranslator = translatorService.getSector('login');

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

            function onWorkspaceChanged(node) {
                $scope.activeNode = node;
                $scope.currentWorkspace = node.item['workspace'];
                $scope.workspaceDropdown['isOpen'] = false;
            }

            function onWorkspaceLoading(item, callback) {
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
            }

            function isEmailValid() {
                var email = ($scope['email'] || '').toLowerCase();
                return EMAIL_PATTERN.test(email);
            }

            function isPasswordValid() {
                var password = ($scope['password'] || '').toLowerCase();
                return PASSWORD_PATTERN.test(password);
            }

            function quickSignIn() {
                if (DEBUG_MODE) {
                    $scope.email = 'efimchuk.roma@gmail.com';
                    $scope.password = 'qwerty';

                    signIn();
                }
            }

            function signIn() {

                loaderService.showLoader();

                apiService.signIn({
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
            }

            $scope.isSystemEmpty = false;
            $scope.treeModel = [];
            $scope.errorMessage = (function () {
                if ($routeParams['authenticate_error_code']) {
                    switch ($routeParams['authenticate_error_code']) {
                        case AuthenticateErrorCodes.USER_NOT_FOUND:
                        {
                            return 'USER_NOT_FOUND';
                        }
                        case AuthenticateErrorCodes.USER_ALREADY_EXISTS:
                        {
                            return 'USER_ALREADY_EXISTS';
                        }
                    }
                }
                return null;
            })();
            $scope.currentWorkspace = undefined;
            $scope.email = "";
            $scope.password = "";
            $scope.workspaceDropdown = {
                isOpen: false
            };

            $scope.onWorkspaceChanged = onWorkspaceChanged;
            $scope.onWorkspaceLoading = onWorkspaceLoading;
            $scope.isEmailValid = isEmailValid;
            $scope.isPasswordValid = isPasswordValid;
            $scope.quickSignIn = quickSignIn;
            $scope.signIn = signIn;

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
                    if (!$scope.errorMessage) {
                        $scope.errorMessage = loginTranslator.translate('system_empty');
                    }
                    $scope.isSystemEmpty = true;
                    loaderService.hideLoader();
                }
            });
        }
    ]
);
