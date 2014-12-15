"use strict";

angular.module('application')

    .controller('ChoiceFormController', [

        '$scope',

        function ($scope) {

            var model = $scope.model;
            var originalModel = $scope.originalModel;

            if (originalModel.type == 'single-choice' || originalModel.type == 'multi-choice') {
                model.data = originalModel.data;
            } else {
                model.data = [];
            }

            function addCase() {
                if ($scope.newCase['length'] > 0) {
                    model.data.push($scope.newCase);
                    $scope.newCase = '';
                }
            }

            function editCase(index) {
            }

            function removeCase(index) {
                model.data = _.without(model.data, model.data[index]);
            }

            $scope.newCase = '';

            $scope.addCase = addCase;
            $scope.editCase = editCase;
            $scope.removeCase = removeCase;
        }
    ]
);
