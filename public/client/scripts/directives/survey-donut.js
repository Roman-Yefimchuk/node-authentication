"use strict";

angular.module('application')

    .directive('surveyDonut', [

        function () {
            return {
                scope: {
                    model: '='
                },
                templateUrl: '/public/client/views/directives/survey-donut-view.html',
                controller: ['$scope', function ($scope) {

                    var chart = $('#chart')[0];
                    var context = chart.getContext('2d');
                    var pieChart = new Chart(context).Pie($scope.model, {
                        segmentShowStroke: false,
                        animation: false,
                        tooltipTemplate: "<%=label%>: <%= value %>%"
                    });

                    $scope.$watch('model', function (model) {
                        _.forEach(pieChart.segments, function (segment, index) {
                            segment.value = parseFloat(model[index].value);
                        });
                        pieChart.update();
                    }, true);

/*                    setInterval(function () {
                        pieChart.update();
                        $scope.$apply();
                    }, 100);*/
                }]
            };
        }
    ]);