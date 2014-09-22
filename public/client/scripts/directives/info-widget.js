"use strict";

angular.module('application')

    .directive('infoWidget', [

        'dialogsService',

        function (dialogsService) {
            return {
                templateUrl: '/client/views/directives/info-widget-view.html',
                controller: ['$scope', function ($scope) {

                    function openReviewDialog() {
                        dialogsService.showReview({
                            onReviewSent: function (model, closeCallback) {
                                closeCallback();
                            }
                        });
                    }

                    $scope.openReviewDialog = openReviewDialog;
                }]
            };
        }
    ]
);