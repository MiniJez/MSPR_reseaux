'use strict'

require('dotenv').config();
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SEND,
        pass: process.env.EMAIL_PASS
    }
});

module.exports.sendEmail = function (usermail, subject, mainText) {
    if (subject === null) { // if the value is null have a defulat string there ( forgot to put it in the function)
        subject = 'New mail from portail.chatelet.fr'
    }
    if (subject === null) { // if the value is null have a defulat string there ( forgot to put it in the function)
        mainText = 'This is the body of the mail'
    }
    var mailOptions = {
        from: 'noreply@portail.chatelet.fr',
        to: usermail,
        subject: subject,
        text: mainText
    };

    //Send the mail
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

//testing
//this.sendEmail('richardadrien0@gmail.com',"lol","lmo")