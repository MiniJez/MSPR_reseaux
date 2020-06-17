const nodemailer = require("nodemailer");

async function main(receiver, text) {
    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "no.reply.chatelet.portail@gmail.com",
            pass: "portailchatelet"
        }
    });

    let info = await smtpTransport.sendMail({
        from: "no.reply.chatelet.portail@gmail.com",
        to: receiver,
        subject: "Code de vérification pour portail.chatelet.fr",
        text: text
    }, (err, info) => {
        if(err) console.log(err)
        if(info) console.log(info)
    });
}

module.exports.sendMail = main;