const https = require("https");
const sqlite = require("sqlite3").verbose();
require('dotenv').config();
const axios = require('axios').default

//Active directory
const ActiveDirectory = require('activedirectory2').promiseWrapper;
const config = {
    url: 'ldap://portail.chatelet.fr',
    baseDN: 'dc=portail,dc=chatelet,dc=fr'
};
const ad = new ActiveDirectory(config);


module.exports.CheckPwn = function (emailToCheck, sendingEmail) {

    try {
        //   emailToCheck = emailToCheck.replace('.', '%');
        emailToCheck = emailToCheck.replace('@', '%40');

        var post_options = {
            host: 'haveibeenpwned.com',
            port: '443',
            path: '/api/v3/breachedaccount/' + emailToCheck,
            method: 'GET',
            headers: {
                'hibp-api-key': process.env.HIBP_KEY,
                'User-Agent': 'chateletchecker'
            }
        };

        https.get(post_options, (respAPi) => {
            //Reads the response and addes it to a buffer
            respAPi.setEncoding('utf8');
            let response = '';
            respAPi.on('data', (chunk) => {
                response += chunk;
            });
            respAPi.on('end', () => {
                // console.log(JSON.parse(response)); //when the buffer is full print it 
            });

            console.log(response);
            if (respAPi.statusCode === 200) {
                let resp = response //table of objects that represent the breaches

                if (resp.length > 0) {
                    // there is breach
                    var HIBPitems = resp.length;
                    var DBitems = 0;
                    var db = new sqlite.Database("database.db3");
                    db.get("SELECT * FROM pwndStatus WHERE login = '" + emailToCheck + "'", (err, item) => { //gets all the breaches for that user
                        if (item !== undefined && item !== null) {
                            DBitems = JSON.parse(item.data).length; //get the item lenth
                            console.log("hibp " + HIBPitems + " | db " + DBitems)

                            if (HIBPitems > DBitems) { // if the APi returns a gier value then whatt we hal alredy stored means that there is a new breach
                                console.log((HIBPitems - DBitems) + " new breach for " + emailToCheck + " !!!")
                                db.run("UPDATE pwndStatus SET data = '" + JSON.stringify(resp) + "' WHERE login = '" + emailToCheck + "'")
                                //send mail if there is a new breach
                                var tmpMail = (sendingEmail === null) ? emailToCheck : sendingEmail //if the mail to send to is empty we use the same mail taht we checked
                                axios.post('http://localhost:3334', {
                                    email: tmpMail,
                                    subject: "Nouvelle faille de securité pour votre adresse mail!",
                                    mainText: "Merci de contacter votre administrateur pour savoir la procédure à suivre"
                                })
                            } else {
                                console.log("no new breach for " + emailToCheck);
                            }

                        }
                        else {
                            db.run("INSERT INTO pwndStatus VALUES('" + emailToCheck + "','" + JSON.stringify(resp) + "')")
                            //send mail if there is a new breach
                            var tmpMail = (sendingEmail === null) ? emailToCheck : sendingEmail //if the mail to send to is empty we use the same mail taht we checked
                            axios.post('http://localhost:3334', {
                                email: tmpMail,
                                subject: "Nouvelle faille de securité pour votre adresse mail!",
                                mainText: "Merci de contacter votre administrateur pour savoir la procédure à suivre"
                            })

                            console.log(emailToCheck + " : user is unknown")
                        }
                    });
                    db.close()
                }
                else {
                    //no breach nothing to do 
                    console.log("no breaches for " + emailToCheck);
                }
            }
            else {
                //no breach nothing to do 
                console.log("Received " + respAPi.statusCode + " for " + emailToCheck + " means that there are no breaches for this adress");
            }
        });
    }
    catch (error) {
        console.error(error)
    }
};

module.exports.CheckPwnAllUsers = function () {

    return null;
    //TODO : this function should cycle throo all the users and check if they have beeen pwnd.
    // we didnt't finish it because of time constraints but the one up there (CheckPwn) works great  so we think this one whoudl work too.

    /*
    ad.getUsersForGroup("Users", function (err, users) {
        if (err) {
            console.log('ERROR: ' + JSON.stringify(err));
            return;
        }

        if (!users) console.log('Group: ' + groupName + ' not found.');
        else {
            console.log(JSON.stringify(users));
        }
    });*/
}

//debug
//this.CheckPwn("richardadrien0@gmail.com", "lou.bege@epsi.fr");
