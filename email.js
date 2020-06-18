require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = (usermail, subject, mainText) => {
    console.log('inside send email')

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_SEND,
            pass: process.env.EMAIL_PASS
        }
    });

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
        } else {
            console.log('Email sent: ' + info.response);
        }

        transporter.close();
    });
}

module.exports.sendEmail = sendEmail
