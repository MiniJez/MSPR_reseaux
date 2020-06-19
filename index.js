const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const ActiveDirectory = require('activedirectory2').promiseWrapper;
const ipcheck = require('./ipcheck');
const { sendEmail } = require('./email');
const useragent = require('express-useragent')
const sqlite = require("sqlite3").verbose();
const ExpressBrute = require('express-brute');
var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
var bruteforce = new ExpressBrute(store, {
    freeRetries: 5, //nombres d'essai possible avant d'etre bloquer
    minWait: 500, //500 miliseconds
    maxWait: 1000 * 60 * 15 // 15 minutes
});
const config = {
    url: 'ldap://portail.chatelet.fr',
    baseDN: 'dc=portail,dc=chatelet,dc=fr'
};
const ad = new ActiveDirectory(config);

require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(ipcheck.ipLoggger);

app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname + '/public/website/index.html'))
    } else {
        res.redirect('/login')
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'))
});

app.post('/login', bruteforce.prevent, (req, res) => {
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
            req.session.password = password;

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
    console.log(req.session.password)

    const ad2 = new ActiveDirectory({
        url: 'ldap://portail.chatelet.fr',
        baseDN: 'dc=portail,dc=chatelet,dc=fr',
        bindDN: req.session.username,
        bindCredentials: req.session.password
    });

    ad2.findUser(req.session.username, function (err, user) {
        if (err) {
            console.log('ERROR-findUser: ' + JSON.stringify(err));
            res.redirect('/login')
        } else if (!user) {
            console.log('User: ' + req.session.username + ' not found.');
            res.redirect('/login')
        } else {
            req.session.email = user.mail

            BrowserCheck(req).then(() => {
                if (req.session.isNewBrowser == false) {
                    req.session.code = Math.floor(100000 + Math.random() * 900000)
                    sendEmail(req.session.email, "Code de vérification pour portail.chatelet.fr", "Your validation code is : " + req.session.code)
                } else {
                    console.log('new browser email')
                    req.session.code = Math.floor(100000 + Math.random() * 900000)
                    sendEmail("lou.bege@epsi.fr", "new browser", "test")
                }

                console.log(req.session.email)
                console.log(req.session.code)

                res.sendFile(path.join(__dirname + '/public/login-validation.html'))
            })
        }
    });
})

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

app.get('/not_found', (req, res) => {
    res.status(404).sendFile(path.join(__dirname + '/public/error_pages/not_found.html'))
});

app.get('/unauthorized', (req, res) => {
    res.status(401).sendFile(path.join(__dirname + '/public/error_pages/unauthorized.html'))
});

app.get('*', (req, res) => {
    res.redirect('/not_found')
});

app.listen(3333, function () {
    console.log('Example app listening on port 3333!')
});

const BrowserCheck = async (req) => {
    console.log("--- Browser check ---")
    var source = req.headers['user-agent'];
    var ua = useragent.parse(source);
    var actualBrowser = ua.browser;
    console.log("Actual browser : " + actualBrowser)

    var username = req.session.username.split("@")[0];
    console.log("Username : " + username)

    var db = new sqlite.Database("database.db3");
    db.serialize(await dbQuery(req, username, actualBrowser, db));
    db.close()

    console.log("--- --- ---")
}

function dbQuery(req, username, actualBrowser, db) {
    return new Promise(function (resolve, reject) {
        db.each("SELECT COUNT(*) as IsExist FROM browsers WHERE login = '" + username + "'", function (err, row) {
            if (err) {
                console.log(err);
                reject(err)
            } else {
                console.log("Is user exists : " + row)
                if (row.IsExist == 0) {
                    console.log("insert")
                    db.run("INSERT INTO browsers VALUES ('" + username + "','" + actualBrowser + "')");
                    resolve("insert")
                } else {
                    db.each("SELECT * FROM browsers WHERE login = '" + username + "'", function (err, item) {
                        if (err) {
                            console.log(err);
                            reject(err)
                        } else {
                            console.log("Last browser : " + item.navigator)
                            if (item.navigator != actualBrowser) {
                                req.session.actualBrowser = actualBrowser
                                console.log('run db update')
                                db.run("UPDATE browsers SET navigator = '" + (actualBrowser) + "' WHERE login = '" + username + "'");
                                console.log('end of run')
                                req.session.isNewBrowser = true
                                resolve()
                            } else {
                                req.session.isNewBrowser = false;
                                resolve()
                            }
                        }
                    });
                }
            }
        });
    })
} 