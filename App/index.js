require('dotenv').config()
const https = require('https')
const path = require('path');
const fs = require('fs')
const { compareIpCountry } = require('./script/ipcheck');
const { browserCheck } = require('./script/browsercheck');
const axios = require('axios').default

//express
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express()

//Brute forcing
const ExpressBrute = require('express-brute');
var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
var bruteforce = new ExpressBrute(store, {
    freeRetries: 5, //nombres d'essai possible avant d'etre bloquer
    minWait: 500, //500 miliseconds
    maxWait: 1000 * 60 * 15 // 15 minutes
});

//Active directory
const ActiveDirectory = require('activedirectory2').promiseWrapper;
const config = {
    url: 'ldap://portail.chatelet.fr',
    baseDN: 'dc=portail,dc=chatelet,dc=fr'
};
const ad = new ActiveDirectory(config);


//Cron 
const { CheckPwn } = require('./script/pwnCheck');
const { send } = require('process');
const CronJob = require('cron').CronJob;
var job = new CronJob('5 4 * * * *', function () {
    //TODO : do for all email adresses
    CheckPwn("richardadrien0@gmail.com", "lou.bege@epsi.fr");
}, null, true, 'America/Los_Angeles');
job.start();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

/**
 * This route isfor getting the index page.
 * @route GET /
 * @returns {object} 200 - the index page
 * @returns {Error}  default - Unexpected error
 */
app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname + '/public/website/index.html'))
    } else {
        res.redirect('/login')
    }
});

/**
 * This route is for getting the login page
 * @route GET /login
 * @returns {object} 200 - Uthe login page
 * @returns {Error}  default - Unexpected error
 */
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'))
});

/**
 * This route is for login the user in
 * @route POST /login
 * @returns {object} 301 - redirectyion to the correct page
 * @returns {Error}  default - Unexpected error
 */
app.post('/login', bruteforce.prevent, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    ad.authenticate(username, password, function (err, auth) {
        if (err) {
            console.log('ERROR-authenticate: ' + JSON.stringify(err));
            res.redirect('/login')
        }
        if (auth) {
            console.log('auth ok')
            req.session.username = username;
            req.session.password = password;

            res.redirect('/login-validation')
        }
        else {
            res.redirect('/login')
        }
    });
});

/**
 * This route is for when the user is correctly authenticated
 * @route GET /login-validation
 * @returns {object} 200 - the page that the user is supposed to acces
 * @returns {Error}  default - Unexpected error
 */
app.get('/login-validation', async (req, res) => {
    console.log("login-validation")

    const ad2 = new ActiveDirectory({
        url: 'ldap://portail.chatelet.fr',
        baseDN: 'dc=portail,dc=chatelet,dc=fr',
        bindDN: req.session.username,
        bindCredentials: req.session.password
    });

    ad2.findUser(req.session.username, async function (err, user) {
        if (err) {
            console.log('ERROR-findUser: ' + JSON.stringify(err));
            res.redirect('/login')
        } else if (!user) {
            console.log('User: ' + req.session.username + ' not found.');
            res.redirect('/login')
        } else {
            req.session.email = user.mail
            req.session.code = Math.floor(100000 + Math.random() * 900000)

            await browserCheck(req)
            await compareIpCountry(req)

            if (req.session.isNewCountry) {
                console.log("Send mail for new country")
                axios.post('http://localhost:3334', {
                    email: req.session.email,
                    subject: "Connexion depuis un pays étrangé à portail.chatelet.fr",
                    mainText: `Nouvelle connexion depuis le pays : ${req.session.country}. Si ce n'est pas vous, merci de contacter le support. Votre code de validation est : ${req.session.code}`
                })
            } else if (req.session.isNewBrowser) {
                console.log("Send mail for new browser")
                console.log(req.session.email, req.session.actualBrowser, req.session.code)
                axios.post('http://localhost:3334', {
                    email: req.session.email,
                    subject: "Connexion avec un nouveau navigateur à portail.chatelet.fr",
                    mainText: "Nouvelle connexion avec le naviguateur " + req.session.actualBrowser + ", Si ce n'est pas vous, merci de contacter le support. \n Votre code de validation est : " + req.session.code
                })
            } else {
                console.log("Send mail for validation code")
                axios.post('http://localhost:3334', {
                    email: req.session.email,
                    subject: "Code de vérification pour portail.chatelet.fr",
                    mainText: "Votre code de validation est : " + req.session.code
                })
            }

            if (req.session.isNewIp) {
                console.log("Send mail for new ip")
                axios.post('http://localhost:3334', {
                    email: req.session.email,
                    subject: "Nouvelle adresse ip détecté",
                    mainText: "Nous avons détecter une nouvelle adresse ip de connexion. Si ce n'est pas vous, merci de contacter le support."
                })
            }

            res.sendFile(path.join(__dirname + '/public/login-validation.html'))
        }
    });
})

/**
 * This route is for validating the users connection
 * @route POST /not_found
 * @returns {object} 301 - refirection to the correct page
 * @returns {Error}  default - Unexpected error
 */
app.post('/login-validation', (req, res) => {
    let code = req.body.code;
    console.log('post login-validation')
    console.log(code, req.session.code)
    if (code == req.session.code) {
        console.log("OK code")
        req.session.isAuthenticated = true;
        res.redirect('/')
    } else {
        res.redirect('login-validation')
    }
});

/**
 * This route is for the 404/Not found page.
 * @route GET /not_found
 * @returns {object} 200 - 404 page
 * @returns {Error}  default - Unexpected error
 */
app.get('/not_found', (req, res) => {
    res.status(404).sendFile(path.join(__dirname + '/public/error_pages/not_found.html'))
});

/**
 * This route is for the 404/Not found page.
 * @route GET /unauthorized
 * @returns {object} 401 - Unauthorized page
 * @returns {Error}  default - Unexpected error
 */
app.get('/unauthorized', (req, res) => {
    res.status(401).sendFile(path.join(__dirname + '/public/error_pages/unauthorized.html'))
});

/**
 * This is in case the route is not define, redirect to the 404 page
 * @route GET /*
 * @returns {object} 301 - Redirection to not found page
 */
app.get('*', (req, res) => {
    res.redirect('/not_found')
});

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app)
    .listen(3333, function () {
        console.log('Example app listening on port 3333! Go to https://localhost:3333/')
    })