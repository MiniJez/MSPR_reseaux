const nodemailer = require('nodemailer');
const express = require('express')
const app = express()
const bodyParser = require("body-parser");
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SEND,
        pass: process.env.EMAIL_PASS
    }
});

app.get('/', (req, res) => {
    res.send('Hello mail service')
})

app.post('/', function (req, res) {
    let email = req.body.email;
    let subject = req.body.subject;
    let mainText = req.body.mainText;

    transporter.sendMail({
        from: 'no.reply.chatelet.portail@gmail.com',
        to: email,
        subject: subject,
        text: mainText
    }, function (error, info) {
        if (error) return console.log(error)

        console.log('Email sent: ' + info.response);
    });

    res.send('Ok')
})

app.listen(3334, function () {
    console.log('Mail service listening on port 3334!')
})
