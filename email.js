'use strict'

require('dotenv').config();
const nodemailer = require('nodemailer');

module.exports.sendEmail = function (usermail, subject, mainText) {
    console.log('inside send email')
    if (subject === null) { // if the value is null have a defulat string there ( forgot to put it in the function)
        subject = 'New mail from portail.chatelet.fr'
    }
    if (subject === null) { // if the value is null have a defulat string there ( forgot to put it in the function)
        mainText = 'This is the body of the mail'
    }

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_SEND,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log('transporter', transporter)

    //Send the mail
    transporter.sendMail({
        from: 'no.reply.chatelet.portail@gmail.com',
        to: usermail,
        subject: subject,
        text: mainText
    }, function (error, info) {
        console.log('inside callback sendemail')
        if (error) {
            console.log(error);
        }
        if(info) {
            console.log(info)
        } 
        else {
            console.log('Email sent: ' + info.response);
        }
    });
}
