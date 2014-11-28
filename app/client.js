"use strict";

(function (require) {

    var fs = require("fs");

    module.exports = function (app, developmentMode) {

        var indexFile = null;

        function getIndexFile(callback) {
            fs.readFile('public/client/index.html', "binary", function (error, file) {
                if (error) {
                    callback.failure(error);
                } else {
                    callback.success(file);
                }
            });
        }

        app.get('/', function (request, response) {

            function sendIndexFile(file) {
                response.writeHead(200);
                response.write(file, "binary");
                response.end();
            }

            function sendError(error) {
                var url = request['url'];
                response.render('page-not-found.ejs', {
                    requestUrl: decodeURIComponent(url)
                });
            }

            if (developmentMode) {
                getIndexFile({
                    success: function (file) {
                        sendIndexFile(file);
                    },
                    failure: function (error) {
                        sendError(error);
                    }
                });
            } else {

                if (indexFile) {
                    sendIndexFile(indexFile);
                } else {
                    getIndexFile({
                        success: function (file) {
                            indexFile = file;

                            sendIndexFile(file);
                        },
                        failure: function (error) {
                            sendError(error);
                        }
                    });
                }
            }
        });
    };

})(require);