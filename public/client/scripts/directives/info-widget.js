"use strict";

angular.module('application')

    .directive('infoWidget', [

        'dialogsService',
        'apiService',

        function (dialogsService, apiService) {
            return {
                templateUrl: '/client/views/directives/info-widget-view.html',
                controller: ['$scope', function ($scope) {

                    function openFeedbackDialog() {
                        dialogsService.showFeedback({
                            onFeedbackSent: function (feedbackModel, closeCallback) {
                                apiService.feedback(feedbackModel, {
                                    success: function () {
                                        closeCallback();
                                    },
                                    failure: function () {
                                        closeCallback();
                                    }
                                });
                            }
                        });
                    }

                    $scope.openFeedbackDialog = openFeedbackDialog;
                }]
            };
        }
    ]
);