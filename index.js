const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const ActiveDirectory = require('activedirectory2').promiseWrapper;
const config = {
    url: 'ldap://portail.chatelet.fr',
    baseDN: 'dc=portail,dc=chatelet,dc=fr'
};
const ad = new ActiveDirectory(config);
const QRcode = require('qr-image');
const { totp } = require ('otplib');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname + '/public/website/index.html'))
    } else {
        res.redirect('/login')
    }
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'))
})

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let code = req.body.code;
    console.log(code)
    let secret = "JBSWY3DPEHPK3PXP";
    const isValid = totp.check(code, secret);
    console.log(isValid)

    // ad.authenticate(username, password, function (err, auth) {
    //     if (err) {
    //         console.log('ERROR: ' + JSON.stringify(err));
    //         res.redirect('/login')
    //     }
    //     if (auth) {
    //         req.session.username = username;
    //         req.session.isAuthenticated = true;
    //         res.redirect('/')
    //     }
    //     else {
    //         res.redirect('/login')
    //     }
    // });
});

app.get('/qrcode', (req, res) => {
    const twoFACode = 'otpauth://totp/chatelet?secret=JBSWY3DPEHPK3PXP'
    // const isValid = totp.check(token, secret);
    // const isValid = totp.verify({ token, secret });
    const qrcode = QRcode.image(twoFACode, { type: 'png' });
    res.setHeader('Content-type', 'image/png');
    qrcode.pipe(res);
})

app.get('/not_found', (req, res) => {
    res.status(404).sendFile(path.join(__dirname + '/public/error_pages/not_found.html'))
})

app.get('/unauthorized', (req, res) => {
    res.status(401).sendFile(path.join(__dirname + '/public/error_pages/unauthorized.html'))
})

app.get('*', (req, res) => {
    res.redirect('/not_found')
})

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
});