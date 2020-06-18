var express = require('express')
var useragent = require('express-useragent')
var sqlite = require("sqlite3")
const mail = require('./email');


module.exports.checkBrowser = function (req, res, next) {
    console.log("--- Browser check ---")
    var source = req.headers['user-agent'];
    var ua = useragent.parse(source);
    var actualBrowser = ua.browser;
    console.log("Actual browser : "+actualBrowser)
    
    var username = req.session.username.split("@")[0];
    console.log("Username : "+username)

    var db = new sqlite.Database("database.db3");    
    db.each("SELECT COUNT(*) as IsExist FROM browsers WHERE login = '"+username+"'", function(err,row){
        if(err){
            console.log(err);
        }else{
            console.log("Is user exists : "+row)
            if (row.IsExist == 0) {
                console.log("insert")
                db.run("INSERT INTO browsers VALUES ('"+username+"','"+actualBrowser+"')");
            }else{
                db.each("SELECT * FROM browsers WHERE login = '"+username+"'", function(err,item){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Last browser : "+item.navigator)
                        if(item.navigator != actualBrowser){
                            console.log("update")
                            mail.sendEmail(req.session.email, "Connexion avec un nouveau navigateur à portail.chatelet.fr", "You have a new connection with " + actualBrowser + ", if it's not you, please contact the support !")
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


    console.log("--- --- ---")
    next()
}