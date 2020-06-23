const sqlite = require('sqlite-async')
const useragent = require('express-useragent');

const browserCheck = async (req) => {
    console.log("--- Browser check ---")
    // get the browser use by the user
    let source = req.headers['user-agent'];
    let ua = useragent.parse(source);
    let actualBrowser = ua.browser;

    // get the user
    let username = req.session.username.split("@")[0];

    let db = await sqlite.open("database.db3");
    // get if the user exists in the table browsers
    let sql = "SELECT COUNT(*) as IsExist FROM browsers WHERE login = ?"
    let dbInfos = await db.get(sql, [username])

    if (dbInfos.IsExist == 0) {
        // if the user not exist, insert in the table, the login of the user and the browser currently used
        console.log("User doesn't exist. Inserting in DB...")

        let sql1 = "INSERT INTO browsers VALUES (?, ?)"
        await db.run(sql1, [username, actualBrowser])
        console.log(`New user inserted : ${username}, ${actualBrowser}`)
    } else {
        // if the user exists, select the used navigator
        console.log("User exist")

        let sql2 = "SELECT * FROM browsers WHERE login = ?"
        let dbBrowser = await db.get(sql2, [username])

        if (dbBrowser.navigator != actualBrowser) {
            // send a mail to inform the user and send him a code to log
            // then update the user in table with the new navigator
            console.log(`This is not his normal browser : old = ${dbBrowser.navigator}, actual = ${actualBrowser}`)
            console.log("Updating browser in DB...")

            let sql3 = "UPDATE browsers SET navigator = ? WHERE login = ?"
            await db.run(sql3, [actualBrowser, username])

            req.session.isNewBrowser = true
            req.session.actualBrowser = actualBrowser
            console.log('Update finish !')
        } else {
            req.session.isNewBrowser = false;
            console.log("Browser not changed")
        }
    }

    console.log("----------------")
}

module.exports.browserCheck = browserCheck