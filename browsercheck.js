var express = require('express')
var useragent = require('express-useragent')
var sqlite = require("sqlite3")
const mail = require('./email');


module.exports.checkBrowser = function (req, res, next) {
    var source = req.headers['user-agent'];
    var ua = useragent.parse(source);
    var actualBrowser = ua.browser;
    
    var username = req.session.username.split("@")[0];

    var db = new sqlite.Database("database.db3");    
    db.each("SELECT COUNT(*) as IsExist FROM browsers WHERE login = '"+username+"'", function(err,row){
        if(err){
            console.log(err);
        }else{
            if (row.IsExist == 0) {
                db.run("INSERT INTO browsers VALUES ('"+username+"','"+actualBrowser+"')");
            }else{
                db.each("SELECT * FROM browsers WHERE login = '"+username+"'", function(err,row){
                    if(err){
                        console.log(err);
                    }else{
                        if(row.navigator != actualBrowser){
                            mail.sendEmail("lou.bege@epsi.fr", "Connexion avec un nouveau navigateur à portail.chatelet.fr", "You have a new connection with " + actualBrowser + ", if it's not you, please contact the support !")
                            db.run("UPDATE browsers SET navigator = '"+(actualBrowser)+"' WHERE login = '"+username+"'");
                            req.session.isNewBrowser = true;
                        }else{
                            req.session.isNewBrowser = false;
                        }
                    }
                });
    
                
            }
        }
    });


    next()
}