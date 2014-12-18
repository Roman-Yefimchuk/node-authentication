"use strict";

angular.module('application')

    .controller('ChoiceFormController', [

        '$scope',

        function ($scope) {

            $scope.$emit('questionEditor:fetchModel', function (model, originalModel) {

                function addCase() {
                    if ($scope.newCase['length'] > 0) {

                        var data = $scope.model['data'];
                        data.push($scope.newCase);

                        $scope.newCase = '';
                    }
                }

                function editCase(index) {
                }

                function removeCase(index) {
                    var data = $scope.model['data'];
                    $scope.model['data'] = _.without(data, data[index]);
                }

                $scope.newCase = '';
                $scope.model = model;

                $scope.addCase = addCase;
                $scope.editCase = editCase;
                $scope.removeCase = removeCase;

                if (originalModel.type == 'single-choice' || originalModel.type == 'multi-choice') {
                    model.data = originalModel.data;
                } else {
                    model.data = [];
                }
            });
        }
    ]
);
