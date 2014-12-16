String.prototype.format = function (args) {
    var value = this;
    for (var key in args) {
        if (args[key] != undefined) {
            var pattern = new RegExp('@{' + key + '}', 'g');
            value = value.replace(pattern, args[key]);
        }
    }
    return String(value);
};

String.prototype.replaceAll = function (searchValue, replaceValue) {
    var pattern = new RegExp(searchValue, 'g');
    return this.replace(pattern, replaceValue);
};

String.prototype.startWith = function (prefix) {
    if (this.length >= prefix.length) {
        return this.substr(0, prefix.length) == prefix;
    }
    return false;
};

String.prototype.endWith = function (suffix) {
    if (this.length >= suffix.length) {
        return this.substr(this.length - suffix.length, this.length) == suffix;
    }
    return false;
};