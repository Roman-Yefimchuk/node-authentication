"use strict";

angular.module('application')

    .controller('ReviewDialogController', [

        '$scope',
        '$modalInstance',
        'options',
        'EMAIL_PATTERN',

        function ($scope, $modalInstance, options, EMAIL_PATTERN) {

            var onReviewSent = options.onReviewSent || function (closeCallback) {
                closeCallback();
            };

            var model = {
                subject: "",
                sender: "",
                message: ""
            };

            function isSubjectValid() {
                return (model.subject || '').length > 0;
            }

            function isSenderValid() {
                var sender = (model['sender'] || '').toLowerCase();
                return EMAIL_PATTERN.test(sender);
            }

            function isMessageValid() {
                return (model.message || '').length > 0;
            }

            function isFormEnabled() {
                return isSubjectValid() && isSenderValid() && isMessageValid();
            }

            function send() {
                onReviewSent(model, function () {
                    $modalInstance.close();
                });
            }

            function cancel() {
                $modalInstance.close();
            }

            $scope.model = model;

            $scope.isSubjectValid = isSubjectValid;
            $scope.isSenderValid = isSenderValid;
            $scope.isMessageValid = isMessageValid;
            $scope.isFormEnabled = isFormEnabled;
            $scope.send = send;
            $scope.cancel = cancel;
        }
    ]
);
