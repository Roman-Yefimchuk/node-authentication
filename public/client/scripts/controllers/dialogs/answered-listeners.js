"use strict";

angular.module('application')

    .controller('AnsweredListenersController', [

        '$scope',
        '$modalInstance',
        '$log',
        'apiService',
        'options',

        function ($scope, $modalInstance, $log, apiService, options) {

            var answers = angular.copy(options.answers);
            var visibleUsers = [];

            var pagination = {
                itemsPerPage: 5,
                maxPaginationSize: 5,
                totalItems: answers.length,
                pageNumber: 1
            };

            function updateDialogTitle() {
                $scope.dialogTitle = 'На запитання відповіли ' + answers.length + ' користувач(ів)';
            }

            function updatePage() {
                pagination.totalItems = answers.length;
                if (answers.length > 0) {
                    var users = getUsersForPage();
                    if (!angular.equals(users, visibleUsers)) {
                        visibleUsers = angular.copy(users);
                        apiService.getUsersById(visibleUsers, {
                            success: function (response) {
                                $scope.answeredListeners = response.users;
                            }
                        });
                    }
                } else {
                    $scope.answeredListeners = [];
                    visibleUsers = [];
                }
            }

            function getUsersForPage() {
                var users = [];

                if (pagination.totalItems > pagination.itemsPerPage) {

                    var fromIndex = (pagination.pageNumber - 1) * pagination.itemsPerPage;
                    for (var index = 0; (index + fromIndex < answers.length) && (index < pagination.itemsPerPage); index++) {
                        users.push(answers[index + fromIndex].userId);
                    }
                } else {
                    _.forEach(answers, function (item) {
                        users.push(item.userId);
                    });
                }

                return users;
            }

            function getListenerAnswer(userId) {
                return _.findWhere(answers, {
                    userId: userId
                }).answer;
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.pagination = pagination;
            $scope.usersForPage = [];

            $scope.$watch('pagination.pageNumber', function () {
                updatePage();
            });

            $scope.getListenerAnswer = getListenerAnswer;
            $scope.cancel = cancel;

            updateDialogTitle();
        }
    ]
);
