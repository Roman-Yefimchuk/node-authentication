String.prototype.format = function (args) {
    var value = this;
    for (var key in args) {
        if (args[key] != undefined) {
            var pattern = new RegExp('@{ *' + key + ' *}', 'g');
            value = value.replace(pattern, args[key]);
        }
    }
    return String(value);
};

String.prototype.replaceAll = function (searchValue, replaceValue) {
    var pattern = new RegExp(searchValue, 'g');
    return this.replace(pattern, replaceValue);
};

function asyncEach(obj, nextCallback, completedCallback) {

    if (obj) {

        if (obj instanceof Array) {

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
    } else {
        completedCallback();
    }
}