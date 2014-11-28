'use strict';

angular.module('application')

    .service('dialogsService', [

        '$modal',

        function ($modal, $window, $timeout) {

            function open(modalOptions) {
                return $modal.open(modalOptions);
            }

            return {
                showWorkspaceManager: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/workspace-manager/workspace-manager-view.html',
                        controller: 'WorkspaceManagerController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showItemEditor: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/item-editor-view.html',
                        controller: 'ItemEditorController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showWorkspaceCreator: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/workspace-creator-view.html',
                        controller: 'WorkspaceCreatorController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showPresentUsers: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/present-users-view.html',
                        controller: 'PresentUsersController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showConfirmation: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/confirmation-dialog-view.html',
                        controller: 'ConfirmationDialogController',
                        size: 'sm',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showAlert: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/alert-dialog-view.html',
                        controller: 'AlertDialogController',
                        size: 'sm',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showFeedback: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/feedback-view.html',
                        controller: 'FeedbackDialogController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                }
            };
        }
    ]
);