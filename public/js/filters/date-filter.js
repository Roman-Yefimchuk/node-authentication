"use strict";

app.filter("dateFilter", function () {
    return function (timestamp, mask) {
        var date = new Date(timestamp);
        return date.format(mask);
    };
});