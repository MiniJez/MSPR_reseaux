/*var express = require('express')
var useragent = require('express-useragent')
var sqlite = require("sqlite3")
const { sendEmail } = require('./email');


module.exports.BrowserCheck = async (req) => {
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
        db.get("SELECT COUNT(*) as IsExist FROM browsers WHERE login = '" + username + "'", function (err, row) {
            console.log("check")
            if (err) {
                console.log("error")
                console.log(err);
                reject(err)
            } else {
                console.log("Is user exists : " + row)
                if (row.IsExist == 0) {
                    console.log("insert")
                    db.run("INSERT INTO browsers VALUES ('" + username + "','" + actualBrowser + "')", function(err){
                        if(err){
                            return console.log(err);
                        }
                        console.log(`A row has been inserted`);
                    });
                    resolve("insert")
                } else {
                    db.get("SELECT * FROM browsers WHERE login = '" + username + "'", function (err, item) {
                        if (err) {
                            console.log(err);
                            reject(err)
                        } else {
                            console.log("Last browser : " + item.navigator)
                            if (item.navigator != actualBrowser) {
                                sendEmail(req.session.email, "Connexion avec un nouveau navigateur à portail.chatelet.fr", "You have a new connecton with "+actualBrowser+", if it's not you, please contact the support. \n Your validation code is : "+req.session.code);
                                setTimeout(function(){
                                    req.session.actualBrowser = actualBrowser
                                    console.log('run db update')
                                    db.run("UPDATE browsers SET navigator = '" + (actualBrowser) + "' WHERE login = '" + username + "'", function(err){
                                        if(err){
                                            return console.log(err);
                                        }
                                        console.log(`A row has been updated`);
                                    });
                                    console.log('end of run')
                                    req.session.isNewBrowser = true
                                    resolve()
                                }, 1500);
                                
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
} */