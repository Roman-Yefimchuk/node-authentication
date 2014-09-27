"use strict";

angular.module('application')

    .filter("searchHighlight", [

        function () {
            return function (text, searchModel) {
                var searchQuery = searchModel.searchQuery;

                if (searchModel.caseSensitive) {
                    var matches = text.split(searchQuery);
                    return matches.join('<span class="search-match">' + searchQuery + '</span>');
                } else {
                    var searchPattern = new RegExp(searchQuery, 'gi');
                    return text.replace(searchPattern, '<span class="search-match">$&</span>');
                }
            }
        }
    ]);