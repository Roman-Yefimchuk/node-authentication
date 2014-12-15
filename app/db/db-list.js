"use strict";

(function (require) {

    module.exports = (function () {

        var _ = require('underscore');

        var DbList = function (collection, getValueFunc) {
            if (+collection.length >= 0) {
                this.collection = collection;
                this.length = collection.length;
                this.getValueFunc = getValueFunc || function (item) {
                    if (typeof item == 'string') {
                        return "'" + item + "'";
                    }
                    return item.toString();
                };
            } else {
                this.collection = [];
                this.length = 0;
            }
        };

        DbList.prototype = {
            toString: function () {
                var items = '';
                var getValueFunc = this.getValueFunc;

                _.forEach(this.collection, function (item) {
                    if (items.length > 0) {
                        items += ', ' + getValueFunc(item);
                    } else {
                        items = getValueFunc(item);
                    }
                });

                return items;
            }
        };

        return DbList;
    })();

})(require);