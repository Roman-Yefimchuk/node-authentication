"use strict";

(function () {

    var rootContext = this;
    var _ = (function () {
        if (rootContext._) {
            return rootContext._;
        } else {
            return require('underscore');
        }
    })();

    var AsyncUtils = (function () {

        function getTasksCount(tasks) {

            if (+tasks.length >= 0) {
                return tasks.length
            }

            var count = 0;
            _.forEach(tasks, function () {
                count++;
            });
            return count;
        }

        function each(obj, nextCallback, completedCallback) {

            if (+obj.length > 0) {

                var index = 0;
                var interrupt = function () {
                    index = obj.length;
                    next();
                };
                var next = function () {

                    if (index == obj.length) {
                        completedCallback();
                    } else {
                        var element = obj[index];
                        nextCallback(element, index++, next, interrupt);
                    }
                };

                next();
            } else {

                var keys = _.keys(obj);
                var index = 0;
                var interrupt = function () {
                    index = keys.length;
                    next();
                };
                var next = function () {

                    if (index == keys.length) {
                        completedCallback();
                    } else {
                        var key = keys[index++];
                        var element = obj[key];
                        nextCallback(element, key, next, interrupt);
                    }
                };

                next();
            }
        }

        function parallel(tasks, successCallback, failureCallback) {
            var completedCount = 0;
            var rejected = false;
            var count = getTasksCount(tasks);

            if (+tasks.length >= 0) {
                var result = [];
                if (count == completedCount) {
                    successCallback(result);
                } else {
                    _.forEach(tasks, function (func) {
                        func(function (taskResult) {

                            if (rejected) {
                                return;
                            }

                            result.push(taskResult);
                            if (count == ++completedCount) {
                                successCallback(result);
                            }
                        }, function (error) {

                            if (rejected) {
                                return;
                            }

                            rejected = true;
                            failureCallback(error);
                        });
                    });
                }
            } else {
                var result = {};
                if (count == completedCount) {
                    successCallback(result);
                } else {
                    _.forEach(tasks, function (task, key) {
                        task(function (taskResult) {

                            if (rejected) {
                                return;
                            }

                            result[key] = taskResult;
                            if (count == ++completedCount) {
                                successCallback(result);
                            }
                        }, function (error) {

                            if (rejected) {
                                return;
                            }

                            rejected = true;
                            failureCallback(error);
                        });
                    });
                }
            }
        }

        function sequentially(tasks, successCallback, failureCallback) {

            var prevResult = undefined;

            if (getTasksCount(tasks) > 0) {
                each(tasks, function (task, next, index, interrupt) {

                    var resolveCallback = function (taskResult) {
                        prevResult = taskResult;
                        next();
                    };

                    var rejectCallback = function (error) {
                        interrupt();
                        failureCallback(error);
                    };

                    if (index != 0) {
                        task(prevResult, resolveCallback, rejectCallback);
                    } else {
                        task(resolveCallback, rejectCallback);
                    }
                }, function () {
                    successCallback(prevResult);
                });
            } else {
                successCallback(prevResult);
            }
        }

        return {
            each: each,
            parallel: parallel,
            sequentially: sequentially
        };

    })();

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = AsyncUtils;
        }
        exports.AsyncUtils = AsyncUtils;
    } else {
        rootContext.AsyncUtils = AsyncUtils;
    }

}.call(this));