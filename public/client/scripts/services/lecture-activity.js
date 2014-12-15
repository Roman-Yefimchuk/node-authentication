'use strict';

angular.module('application')

    .service('lectureActivityService', [

        '$timeout',
        'apiService',

        function ($timeout, apiService) {
            return {
                getActivityCollection: function () {

                    var activityCollection = [];
                    var activityQueue = [];

                    function addActivityItem(activity) {

                        if (activityQueue.length == 0) {
                            activityQueue.push(activity);
                        }

                        if (_.contains(activityQueue, activity)) {

                            apiService.getQuickTimestamp(function (response) {

                                $timeout(function () {
                                    activityCollection.unshift({
                                        timestamp: response.timestamp,
                                        activity: activity
                                    });
                                });

                                activityQueue = _.without(activityQueue, activity);

                                if (activityQueue.length > 0) {
                                    var nextActivity = activityQueue[activityQueue.length - 1];
                                    addActivityItem(nextActivity);
                                }
                            });

                        } else {
                            activityQueue.unshift(activity);
                        }
                    }

                    activityCollection.push = function (activity) {
                        addActivityItem(activity);
                        return activityCollection;
                    };

                    return activityCollection
                }
            }
        }
    ]
);