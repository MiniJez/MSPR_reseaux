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
const { sendMail } = require('./otpmail');

require('dotenv').config()

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
    //sendMail("your code is : 123456").catch(console.error);
    let username = req.body.username;
    let password = req.body.password;
    console.log(username, password)

    ad.authenticate(username, password, function (err, auth) {
        if (err) {
            console.log('ERROR-authenticate: ' + JSON.stringify(err));
            res.redirect('/login')
        }
        if (auth) {
            console.log('auth ok')
            req.session.username = username;
            req.session.isAuthenticated = true;
            res.redirect('/login-validation')
        }
        else {
            res.redirect('/login')
        }
    });
});

app.get('/login-validation', (req, res) => {
    console.log("login-validation")
    console.log(req.session.username)
    ad.findUser(req.session.username, function (err, user) {
        if (err) {
            console.log('ERROR-findUser: ' + JSON.stringify(err));
            res.redirect('/login')
        } 
        
        if (!user) {
            console.log('User: ' + req.session.username + ' not found.');
            res.redirect('/login')
        } else {
            res.send(JSON.stringify(user));
        }
    });
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