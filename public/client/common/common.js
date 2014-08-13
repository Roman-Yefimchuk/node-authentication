String.prototype.format = function (args) {
    var value = this;
    for (var key in args) {
        var pattern = new RegExp('{' + key + '}', 'g');
        value = value.replace(pattern, args[key]);
    }
    return value;
};

String.prototype.replaceAll = function (searchValue, replaceValue) {
    var pattern = new RegExp(searchValue, 'g');
    return this.replace(pattern, replaceValue);
};