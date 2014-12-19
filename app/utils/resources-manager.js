"use strict";

(function (require) {

    var fileSystem = require("fs");

    function getResourceAsString(fileName, callback) {
        fileSystem.readFile(fileName, 'utf8', function (error, file) {
            if (error) {
                callback.failure(error);
            } else {
                callback.success(file);
            }
        });
    }

    function getResourceAsStringSync(fileName) {
        return fileSystem.readFileSync(fileName, "utf8");
    }

    module.exports = {
        getResourceAsString: getResourceAsString,
        getResourceAsStringSync: getResourceAsStringSync
    };

})(require);