const geoip = require('geoip-lite');
const publicIp = require('public-ip');
const sqlite = require('sqlite-async');

const getIp = async () => {
    return await publicIp.v4()
}

const getIpCountry = (ip) => {
    return geoip.lookup(ip);
}

const compareIpCountry = async (req) => {
    console.log("-------IpCheck----------")
    let db = await sqlite.open('database.db3')

    //let ip = await getIp();
    //console.log("ip : ", ip)
    let ip = req.connection.remoteAddress.replace('::ffff:', '');
    console.log(ip)
    let ipInfos = getIpCountry(ip);
    console.log("ip country : ", ipInfos.country)

    req.session.isNewCountry = false
    req.session.isNewIp = false
    let username = req.session.username.split("@")[0];

    let sql = "SELECT * FROM ipInfo WHERE login = ?";
    let dbInfos = await db.get(sql, [username]);
    if (!dbInfos == undefined) {
        sql = "INSERT INTO ipInfo(login, ip, country) VALUES (?, ?, ?)"
        await db.run(sql, [username, ip, ipInfos.country])

        console.log("First connexion ip insertion")
    } else if (dbInfos.ip != ip && dbInfos.country == ipInfos.country) {
        sql = "UPDATE ipInfo SET ip = ? WHERE login = ?"
        await db.run(sql, [ip, username])

        req.session.ip = ip
        req.session.isNewIp = true
        console.log("Ip updated, sending mail to " + username)
    } else if (dbInfos.country != ipInfos.country) {
        sql = "UPDATE ipInfo SET ip = ?, country = ? WHERE login = ?"
        await db.run(sql, [ip, ipInfos.country, username])

        req.session.country = ipInfos.country
        req.session.isNewCountry = true
        console.log("Ip + country updated, sending mail to " + username + " . A validation is required")
    }

    console.log('-------------------')
}

module.exports.compareIpCountry = compareIpCountry