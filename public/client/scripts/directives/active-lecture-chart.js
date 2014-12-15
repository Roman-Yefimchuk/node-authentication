"use strict";

angular.module('application')

    .directive('activeLectureChart', [

        '$rootScope',
        '$filter',

        function ($rootScope, $filter) {
            return {
                scope: {
                    model: '='
                },
                templateUrl: '/client/views/directives/active-lecture-chart-view.html',
                controller: ['$scope', function ($scope) {

                    function getChartModel(chartPoints) {
                        return {
                            labels: (function () {
                                var labels = (function () {
                                    if (chartPoints.length > 0) {
                                        return ["00:00"];
                                    }
                                    return ["00:00", "01:00"];
                                })();
                                _.forEach(chartPoints, function (chartPoint) {
                                    labels.push($filter('formatTimestamp')(chartPoint.timestamp, '@{minutes}:@{seconds}'));
                                });
                                return labels;
                            })(),
                            datasets: [
                                {
                                    fillColor: "rgba(220,220,220,0.2)",
                                    strokeColor: "rgba(220,220,220,1)",
                                    pointColor: "rgba(220,220,220,1)",
                                    pointStrokeColor: "#fff",
                                    pointHighlightFill: "#fff",
                                    pointHighlightStroke: "rgba(220,220,220,1)",
                                    data: (function () {
                                        var data = (function () {
                                            if (chartPoints.length > 0) {
                                                return [0];
                                            }
                                            return [0, 0];
                                        })();
                                        _.forEach(chartPoints, function (chartPoint) {
                                            data.push(chartPoint.presentListeners);
                                        });
                                        return data;
                                    })()
                                },
                                {
                                    fillColor: "rgba(151,187,205,0.2)",
                                    strokeColor: "rgba(151,187,205,1)",
                                    pointColor: "rgba(151,187,205,1)",
                                    pointStrokeColor: "#fff",
                                    pointHighlightFill: "#fff",
                                    pointHighlightStroke: "rgba(151,187,205,1)",
                                    data: (function () {
                                        var data = (function () {
                                            if (chartPoints.length > 0) {
                                                return [0];
                                            }
                                            return [0, 0];
                                        })();
                                        _.forEach(chartPoints, function (chartPoint) {
                                            data.push(((chartPoint.understandingPercentage * chartPoint.presentListeners) / 100).toFixed(2));
                                        });
                                        return data;
                                    })()
                                }
                            ]
                        };
                    }

                    //TODO: quick bug fix, not good
                    var intervalId = setInterval(function () {

                        var canvas = $('#line-chart')[0];

                        if (canvas) {
                            var context = canvas.getContext('2d');

                            var getChart = function () {
                                return  new Chart(context).Line($scope.model, {
                                    segmentShowStroke: false,
                                    animation: false,
                                    bezierCurve: false
                                });
                            };

                            $scope.lineChart = getChart();

                            $scope.$watch('model', function (model) {
                                $scope.lineChart = getChart();
                            }, true);

                            clearInterval(intervalId);
                        }

                    }, 50);
                }]
            };
        }
    ]);