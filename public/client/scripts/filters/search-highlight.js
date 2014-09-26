"use strict";

angular.module('application')

    .filter("searchHighlight", [

        function () {
            return function (text, searchQuery, options) {

                return text.split(query).join('<span class="ui-match">' + search + '</span>');
            }
        }
    ]);