"use strict";

angular.module('application')

    .directive('lectureStatistic', [

        '$rootScope',
        '$filter',

        function ($rootScope, $filter) {
            return {
                scope: {
                    model: '=',
                    graphId: '@'
                },
                templateUrl: '/public/client/views/directives/statistic-graph-view.html',
                controller: ['$scope', function ($scope) {

                    var data = {
                        labels: (function () {
                            var labels = [];
                            _.forEach($scope.model, function (chartPoint) {
                                labels.push($filter('formatTimestamp')(chartPoint.timestamp, '@{minutes}:@{seconds}'));
                            });
                            return labels;
                        })(),
                        datasets: [
                            {
                                label: "My First dataset",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(220,220,220,1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: (function () {
                                    var data = [];
                                    _.forEach($scope.model, function (chartPoint) {
                                        data.push(chartPoint.presentListeners);
                                    });
                                    return data;
                                })()
                            },
                            {
                                label: "My Second dataset",
                                fillColor: "rgba(151,187,205,0.2)",
                                strokeColor: "rgba(151,187,205,1)",
                                pointColor: "rgba(151,187,205,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(151,187,205,1)",
                                data: (function () {
                                    var data = [];
                                    _.forEach($scope.model, function (chartPoint) {
                                        data.push(((chartPoint.understandingPercentage * chartPoint.presentListeners) / 100).toFixed(2));
                                    });
                                    return data;
                                })()
                            }
                        ]
                    };

                    //TODO: quick bug fix, not good
                    var intervalId = setInterval(function () {

                        var canvas = $('#graph-' + $scope.graphId)[0];

                        if (canvas) {
                            var context = canvas.getContext('2d');

                            $scope.lineChart = new Chart(context).Line(data, {
                                segmentShowStroke: false,
                                animation: false,
                                tooltipTemplate: "<%=label%>: <%= value %>%",
                                bezierCurve: false
                            });

                            clearInterval(intervalId);
                        }

                    }, 50);
                }]
            };
        }
    ]);