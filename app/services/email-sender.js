//http://blog.nodeknockout.com/post/34641712180/sending-email-from-node-js
//http://www.nodemailer.com/

"use strict";

var nodeMailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = {
    sendEmail: function (subject, sender, message, callback) {

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
            subject: "Subject",
            text: "Text"
        }, callback);
    }
};