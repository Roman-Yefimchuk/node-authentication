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

function syncCycle(array, nextCallback, completedCallback) {

    if (array instanceof Array) {
        var index = 0;
        var next = function () {
            if (index == array.length) {
                completedCallback();
            } else {
                var element = array[index];
                nextCallback(element, index, next);
                index++;
            }
        };

        next();
    } else {
        completedCallback();
    }
}