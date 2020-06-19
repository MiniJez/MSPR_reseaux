const http = require("http");

async function ipLogger(req, res, next) {
    console.log("--- Ip Logger ---")
    var ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    console.log(req.headers['x-forwarded-for'])
    console.log(req.connection.remoteAddress)
    console.log(req.socket.remoteAddress)

    var username = req.session.username.split("@")[0];
    console.log("ip : " + ip)
    console.log("username : " + username)

    http.get("http://ip-api.com/json/" + ip, (respAPi) => {
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
            let actualCountry = response.country
            console.log(ip, "ok")
            var db = new sqlite.Database("database.db3");
            db.serialize(dbQuery(req, username, actualCountry, db));
            db.close()
        }


    });

    console.log("--- --- ---")
}

function dbQuery(req, username, actualCountry, db) {
    return new Promise(function (resolve, reject) {
        db.get("SELECT COUNT(*) as IsExist FROM userIP WHERE login = '" + username + "'", function (err, row) {
            if (err) {
                console.log(err);
                reject(err)
            } else {
                console.log("Is user exists : " + row)
                if (row.IsExist == 0) {
                    console.log("insert")
                    db.run("INSERT INTO userIP VALUES ('" + username + "','" + actualCountry + "')", function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log(`A row has been inserted`);
                    });
                    resolve("insert")
                } else {
                    db.get("SELECT * FROM userIP WHERE login = '" + username + "'", function (err, item) {
                        if (err) {
                            console.log(err);
                            reject(err)
                        } else {
                            console.log("Last country : " + item.country)
                            if (item.country != actualCountry) {
                                req.session.actualCountry = actualCountry
                                console.log('run db update')
                                db.run("UPDATE userIP SET navigator = '" + (actualCountry) + "' WHERE login = '" + username + "'", function (err) {
                                    if (err) {
                                        return console.log(err);
                                    }
                                    console.log(`A row has been updated`);
                                });
                                console.log('end of run')
                                req.session.isNewCountry = true
                                resolve()
                            } else {
                                req.session.isNewCountry = false;
                                resolve()
                            }
                        }
                    });
                }
            }
        });
    })
}

module.exports.ipLogger = ipLogger;