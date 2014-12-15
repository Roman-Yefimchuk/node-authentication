"use strict";

angular.module('application')

    .filter("formatTimestamp", [

        function () {

            var pattern = "@{hours}:@{minutes}:@{seconds}";

            function formatNumber(n) {
                if (n < 10) {
                    return '0' + n;
                }
                return '' + n;
            }

            return function (delay, template) {

                pattern = template || pattern;

                var hours = Math.floor(delay / 3600);
                var minutes = Math.floor((delay - (hours * 3600)) / 60);
                var seconds = delay - (hours * 3600) - (minutes * 60);

                return pattern.format({
                    hours: formatNumber(hours),
                    minutes: formatNumber(minutes),
                    seconds: formatNumber(seconds)
                });
            };
        }
    ]);