"use strict";

(function (require) {

    var nodeMailer = require("nodemailer");
    var smtpTransport = require('nodemailer-smtp-transport');

    module.exports = {
        sendEmail: function (subject, senderAddress, message, callback) {

            var transporter = nodeMailer.createTransport(smtpTransport({
                service: "Yandex",
                auth: {
                    user: "animland@yandex.ru",
                    pass: "qwerty12345"
                }
            }));

            transporter.sendMail({
                from: "animland@yandex.ru",
                to: "romane@ikrok.net",
                subject: subject,
                html: "<b>From: </b>" + senderAddress + "<p>" + message
            }, callback);
        }
    };
})(require);