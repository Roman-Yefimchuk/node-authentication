'use strict';

angular.module('application')

    .service('dialogsService', [

        '$modal',

        function ($modal) {

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
                showTaskEditor: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/task-editor-view.html',
                        controller: 'TaskEditorController',
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
                },
                showLinkEditor: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/link-editor-dialog-view.html',
                        controller: 'LinkEditorDialogController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showQuestionEditor: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/question-editor/question-editor-view.html',
                        controller: 'QuestionEditorController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showSuspendedDialog: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/suspended-dialog.html',
                        controller: 'SuspendDialogController',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showPresentListeners: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/present-listeners-view.html',
                        controller: 'PresentListenersController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showAnsweredListeners: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/answered-listeners-view.html',
                        controller: 'AnsweredListenersController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showProfileEditor: function (options) {
                    return open({
                        templateUrl: '/public/client/views/controllers/dialogs/profile-editor-dialog-view.html',
                        controller: 'ProfileEditorDialogController',
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