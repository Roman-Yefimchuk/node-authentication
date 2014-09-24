"use strict";

angular.module('application')

    .filter("formatDate", [

        '$rootScope',
        'translatorService',

        function ($rootScope, translatorService) {

            function getTranslations() {
                return {
                    dayNames: translatorService.translate('date_formatter.day_names'),
                    monthNames: translatorService.translate('date_formatter.month_names')
                }
            }

            var translations = getTranslations();

            translatorService.onLocaleChanged($rootScope, function () {
                translations = getTranslations();
            });

            var dateFormat = function () {

                var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;
                var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
                var timezoneClip = /[^-+\dA-Z]/g;
                var pad = function (val, len) {
                    val = String(val);
                    len = len || 2;
                    while (val.length < len) {
                        val = "0" + val;
                    }
                    return val;
                };

                return function (date, mask, utc) {

                    mask = String(masks[mask] || mask || masks["DEFAULT"]);

                    if (mask.slice(0, 4) == "UTC:") {
                        mask = mask.slice(4);
                        utc = true;
                    }

                    var prefix = utc ? "getUTC" : "get";

                    var d = date[prefix + "Date"]();
                    var D = date[prefix + "Day"]();
                    var m = date[prefix + "Month"]();
                    var y = date[prefix + "FullYear"]();
                    var H = date[prefix + "Hours"]();
                    var M = date[prefix + "Minutes"]();
                    var s = date[prefix + "Seconds"]();
                    var L = date[prefix + "Milliseconds"]();
                    var o = utc ? 0 : date.getTimezoneOffset();
                    var flags = {
                        d: d,
                        dd: pad(d),
                        ddd: translations.dayNames[D],
                        dddd: translations.dayNames[D + 7],
                        m: m + 1,
                        mm: pad(m + 1),
                        mmm: translations.monthNames[m],
                        mmmm: translations.monthNames[m + 12],
                        yy: String(y).slice(2),
                        yyyy: y,
                        h: H % 12 || 12,
                        hh: pad(H % 12 || 12),
                        H: H,
                        HH: pad(H),
                        M: M,
                        MM: pad(M),
                        s: s,
                        ss: pad(s),
                        l: pad(L, 3),
                        L: pad(L > 99 ? Math.round(L / 10) : L),
                        t: H < 12 ? "a" : "p",
                        tt: H < 12 ? "am" : "pm",
                        T: H < 12 ? "A" : "P",
                        TT: H < 12 ? "AM" : "PM",
                        Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                        o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                        S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                    };

                    return mask.replace(token, function ($0) {
                        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
                    });
                };
            }();

            var masks = {
                DEFAULT: "ddd mmm dd yyyy HH:MM:ss",
                SHORT_DATE: "m/d/yy",
                MEDIUM_DATE: "mmm d, yyyy",
                LONG_DATE: "mmmm d, yyyy",
                FULL_DATE: "dddd, mmmm d, yyyy",
                SHORT_TIME: "h:MM TT",
                MEDIUM_TIME: "h:MM:ss TT",
                LONG_TIME: "h:MM:ss TT Z",
                ISO_DATE: "yyyy-mm-dd",
                ISO_TIME: "HH:MM:ss",
                ISO_DATE_TIME: "yyyy-mm-dd'T'HH:MM:ss",
                ISO_UTC_DATE_TIME: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
            };

            return function (timestamp, mask, utc) {
                var date = new Date(timestamp);
                return dateFormat(date, mask, utc);
            };
        }
    ]);