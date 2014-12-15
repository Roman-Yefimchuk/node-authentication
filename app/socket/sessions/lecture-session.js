"use strict";

(function (require) {

    var _ = require('underscore');

    module.exports = function (dbProvider) {

        var lectures = [];

        var startTimer = (function () {

            function timerHandler(lecture) {
                var timeline = lecture.timeline;
                var timeMarker = timeline[timeline.length - 1];

                var finishTime = timeMarker.finishTime;
                if (finishTime == 'expected') {
                    finishTime = _.now();
                }

                if (Math.floor((finishTime - _.now()) / 1000) <= 60) {
                    var chartPoints = lecture.chartPoints;
                    chartPoints.push({
                        timestamp: lecture.getTotalDuration(),
                        presentListeners: lecture.listeners['length'],
                        understandingPercentage: lecture.getAverageUnderstandingValue()
                    });

                    //TODO: update chart
                }
            }

            return function (lecture) {
                lecture.timerId = setInterval(function () {
                    timerHandler(lecture);
                }, 1000 * 60);
            }
        })();

        var stopTimer = function (lecture) {
            var timerId = lecture.timerId;
            if (timerId) {
                clearInterval(timerId);
                lecture.timerId = null;
            }
        };

        var LectureSession = function (id, lecturerId) {
            this.id = id;
            this.lecturerId = lecturerId;
            this.timeline = [];
            this.status = 'stopped';
            this.teacherQuestions = {};
            this.timerId = null;
            this.chartPoints = [];
            this.listeners = [];
        };

        LectureSession.prototype = {
            startLecture: function (onStartedCallback) {
                var lecture = this;

                lecture.status = 'started';

                var timeline = lecture.timeline;
                timeline.push({
                    startTime: _.now(),
                    finishTime: 'expected',
                    status: 'started'
                });

                startTimer(lecture);

                dbProvider.updateLectureStatus(lecture.id, lecture.lecturerId, 'started', function () {
                    lectures.push(lecture);
                    onStartedCallback(lecture);
                });
            },
            resumeLecture: function (onResumeCallback) {
                var lecture = this;

                lecture.status = 'started';

                var timeline = lecture.timeline;
                var timeMarker = timeline[timeline.length - 1];
                timeMarker.finishTime = _.now();

                timeline.push({
                    startTime: _.now(),
                    finishTime: 'expected',
                    status: 'started'
                });

                startTimer(lecture);

                dbProvider.updateLectureStatus(lecture.id, lecture.lecturerId, 'started', function () {
                    onResumeCallback(lecture);
                });
            },
            suspendLecture: function (onSuspendedCallback) {
                var lecture = this;

                lecture.status = 'suspended';

                var timeline = lecture.timeline;
                var timeMarker = timeline[timeline.length - 1];
                timeMarker.finishTime = _.now();

                timeline.push({
                    startTime: _.now(),
                    finishTime: 'expected',
                    status: 'suspended'
                });

                stopTimer(lecture);

                dbProvider.updateLectureStatus(lecture.id, lecture.lecturerId, 'suspended', function () {
                    onSuspendedCallback(lecture);
                });
            },
            stopLecture: function (onStoppedCallback) {

                var lecture = this;

                lecture.status = 'stopped';

                var timeline = lecture.timeline;
                var timeMarker = timeline[timeline.length - 1];
                timeMarker.finishTime = _.now();

                stopTimer(lecture);

                dbProvider.updateLectureStatus(lecture.id, lecture.lecturerId, 'stopped', function () {
                    dbProvider.updateStatisticForLecture(lecture.id, {
                    }, function () {

                        _.forEach(lecture.listeners, function (listenerSession) {
                            listenerSession.leave();
                        });

                        lectures = _.without(lectures, lecture);

                        onStoppedCallback(lecture);
                    });
                });
            },
            getDuration: function () {

                var duration = 0;
                var timeline = this.timeline;

                _.forEach(timeline, function (timeMarker) {

                    if (timeMarker.status == 'started') {

                        var startTime = timeMarker.startTime;
                        var finishTime = timeMarker.finishTime;

                        if (finishTime == 'expected') {
                            finishTime = _.now();
                        }

                        duration += (finishTime - startTime);
                    }
                });

                return Math.floor(duration / 1000);
            },
            getTotalDuration: function () {

                var timeline = this.timeline;
                var startTime = timeline[0].startTime;
                var finishTime = timeline[timeline.length - 1].finishTime;
                if (finishTime == 'expected') {
                    finishTime = _.now();
                }

                return Math.floor((finishTime - startTime) / 1000);
            },
            getDate: function () {
                var timeline = this.timeline;
                return Math.floor(timeline[0].startTime / 1000);
            },
            getAverageUnderstandingValue: function () {

                var value = 0;
                var count = 0;

                _.forEach(this.listeners, function (listenerSession) {
                    if (listenerSession.requestCount > 0) {
                        count++;
                        value += (listenerSession.understandingValue / listenerSession.requestCount);
                    }
                });

                if (count > 0) {
                    return ((value / count) * 100).toFixed(1);
                }

                return "0.0";
            }
        };

        LectureSession.findById = function (lectureId) {
            return _.findWhere(lectures, {
                id: lectureId
            });
        };

        LectureSession.each = function (fn) {
            return _.forEach(lectures, fn);
        };

        return LectureSession;

    };

})(require);