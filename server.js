//#region MODULES
const http = require("http");
const fs = require("fs");
const url = require("url");
const mysql = require("mysql");
//#endregion MODULES---------------------------------------------------------------------------------------

//#region MYSQL
let dbConfig = {
    host: "remotemysql.com",
    port: 3306,
    database: "T0KML4uumK",
    user: "T0KML4uumK",
    password: "7Xah2M7CBF"
};
let dataBase;
function connectToDataBase() {
    dataBase = mysql.createConnection(dbConfig);


    dataBase.connect(function (err) {                           //error handling while connecting
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(connectToDataBase, 2000);                //introduce a delay before attempting to connect again, to avoid a hot loop, and to allow our node script to process asynchronous requests in the meantime.
        }
    });

    dataBase.on('error', function (err) {                       //error handling while connected
        console.log('error while connected to db', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {          //connection to the mysql server is usually lost due to either server restart, or a connnection idle timeout.
            connectToDataBase();
        }
        else {
            console.log(err);
        }
    });
}
connectToDataBase();
//#endregion MYSQL---------------------------------------------------------------------------------------

//#region CLASSES
class VotingApp {
    /*--properties--*/
    /*--constructors--*/
    constructor() {
        if (this instanceof StaticClass) {
            throw Error('A static class cannot be instantiated.');
        }
    }

    /*--methods--*/
    static getPollsArray(p_UUId) {
        return new Promise(function (resolve, reject) {
            let pollsArray = [];
            let sqlCommand = `SELECT * FROM POLLS where UUId="${p_UUId}" OR UUId="0";`
            dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    for (let row of result) {
                        let poll = new Poll(row.id_pk, row.title, row.UUId);
                        pollsArray.push(poll);
                    }
                    resolve(pollsArray);
                }
            });
        });
    }
    static getPoll(p_id_pk) {
        return new Promise(function (resolve, reject) {
            let sqlCommand = `SELECT * FROM POLLS where id_pk=${p_id_pk};`;
            dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    let row = result[0];
                    let poll = new Poll(row.id_pk, row.title, row.UUId);
                    resolve(poll);
                }
            });
        });
    }
    static addPoll(p_title, p_UUId) {
        return new Promise(function (resolve, reject) {
            let sqlCommand = `INSERT INTO POLLS (title,UUId) values ("${p_title}","${p_UUId}");`;
            dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    console.log("Poll added.");
                    let id = result.insertId;
                    let poll = new Poll(id, p_title, p_UUId);
                    resolve(poll);
                }
            });
        });
    }
    static removePoll(p_id_pk) {
        let sqlCommand = `DELETE FROM POLLS where id_pk="${p_id_pk}";`;
        dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else console.log("Poll removed.");
        });
    }
}

class Poll {
    /*--properties--*/
    id_pk = 0;
    title = "";
    UUId = "";
    /*--constructors--*/
    constructor(p_id_pk, p_title, p_UUId) {
        this.id_pk = p_id_pk;
        this.title = p_title;
        this.UUId = p_UUId;
    }
    /*--methods--*/
    getOptionsArray() {
        let id = this.id_pk;
        return new Promise(function (resolve, reject) {
            let optionsArray = [];
            let sqlCommand = `SELECT * FROM OPTIONS WHERE id_fk=${id};`;
            dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    for (let row of result) {
                        let option = new Option(row.id_fk, row.title);
                        option.numOfVotes = row.numOfVotes;
                        optionsArray.push(option);
                    }
                    resolve(optionsArray);
                }
            });
        });
    }
    addOption(p_title, p_numOfVotes = 0) {
        let sqlCommand = `INSERT INTO OPTIONS values ("${this.id_pk}","${p_title}",${p_numOfVotes});`;
        let id = this.id_pk;
        dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else {
                console.log("Option added.");
            }
        });
    }
    removeOptions() {
        let sqlCommand = `DELETE FROM OPTIONS where id_pk="${this.id_pk}";`;
        dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else console.log("Options removed.");
        });
    }
}

class Option {
    /*--properties--*/
    id_fk = 0;
    title = "";
    numOfVotes = 0;
    /*--constructors--*/
    constructor(p_id_fk, p_title) {
        this.id_fk = p_id_fk;
        this.title = p_title;
    }
    /*--methods--*/
    addVote() {
        let sqlCommand = `UPDATE OPTIONS SET numOfVotes = numOfVotes + 1 WHERE id_fk=${this.id_fk} AND title="${this.title}"`;
        dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else console.log("Vote added.");
            this.numOfVotes++;
        });
    }
}
//#endregion CLASSES---------------------------------------------------------------------------------------

//#region SERVER
var server;
server = http.createServer(connect);
server.listen(process.env.PORT || 3000);

/*--routing--*/
function connect(request, response) {

    /*--serving pollSelection.html--*/
    if (request.url == "/" || request.url == "/pollSelection.html" && request.method == "GET") {

        response.setHeader("Content-Type", "text/html");
        fs.readFile("./pollSelection.html", null, function (error, data) {
            if (error == true) {
                response.statusCode = 404;
                response.write("Az oldal nem elérhető!");
            }
            else {
                response.statusCode = 200;
                response.write(data);
            }
            response.end();
        });
    }

    /*--serving style.css--*/
    else if (request.url == "/style.css" && request.method == "GET") {
        fs.readFile("./style.css", null, function (error, data) {
            response.writeHead(200, { "Content-Type": "text/css" });
            response.write(data);
            response.end();
        });
    }

    /*--serving pollCreation.html--*/
    else if (request.url == "/pollCreation.html" && request.method == "GET") {

        response.setHeader("Content-Type", "text/html");
        fs.readFile("./pollCreation.html", null, function (error, data) {
            if (error == true) {
                response.statusCode = 404;
                response.write("Az oldal nem elérhető!");
            }
            else {
                response.statusCode = 200;
                response.write(data);
            }
            response.end();
        });
    }

    /*--serving dynamic html--*/
    else if (request.url.match(/poll[0-9]+/g) !== null && request.method == "GET") {

        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;

        generateHTML(query.id)
            .then(function (resolve) {
                let htmlContent = resolve;
                response.setHeader("Content-Type", "text/html");
                response.statusCode = 200;
                response.write(htmlContent);
                response.end();
            })
            .catch((mainreject) => console.log(mainreject));
    }

    /*--serving voting.js--*/
    else if (request.url == "/voting.js" && request.method == "GET") {
        fs.readFile("./voting.js", null, function (error, js) {
            response.writeHead(200, { "Content-Type": "text/js" });
            response.write(js);
            response.end();
        });
    }

    /*--API getPollsArrayInc--*/
    else if (request.url == "/getPollsArrayInc" && request.method == "POST") {
        
        const body = [];
        request.on("data", (chunk) => {
            body.push(chunk);
        });

        request.on("end", () => {
            const buffered = Buffer.concat(body).toString();
            console.log("A getPollsArray API bejövő adatai:" + buffered);

            const incomingData = JSON.parse(decodeURIComponent(buffered));
            const UUId = incomingData.UUId; 

            VotingApp.getPollsArray(UUId)
                .then(function (resolve) {
                    let pollsArray = resolve;
                    response.writeHead(200, { "Content-Type": "text/html", "Access-Control-Allow-Origin": "http://www.localhost:3000" });
                    response.write(JSON.stringify(pollsArray));
                    response.end();
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--API addPollInc--*/
    else if (request.url == "/addPollInc" && request.method == "POST") {

        const body = [];
        request.on("data", (chunk) => {
            body.push(chunk);
        });

        request.on("end", () => {
            const buffered = Buffer.concat(body).toString();
            console.log("Az addPoll API bejövő adatai:" + buffered);

            let incomingFormData = parser(decodeURIComponent(buffered));
            console.log(incomingFormData);

            VotingApp.addPoll(incomingFormData.title, incomingFormData.UUId)
                .then(function (resolve) {
                    let poll = resolve;
                    let optionTitles = Object.values(incomingFormData);
                    for (i = 1; i < optionTitles.length - 1; i++) {
                        poll.addOption(optionTitles[i], 0);
                    }
                    generateHTML(poll.id_pk)
                        .then(function (resolve) {
                            let htmlContent = resolve;
                            response.setHeader("Content-Type", "text/html");
                            response.setHeader("Location", `http://www.localhost:3000/poll${poll.id_pk}?id=${poll.id_pk}`);
                            response.statusCode = 302;
                            response.end();
                        })
                        .catch(function (reject) { console.log(reject); });
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--API addVoteInc--*/
    else if (request.url == "/addVoteInc" && request.method == "POST") {

        const body = [];
        request.on("data", (chunk) => {
            body.push(chunk);
        });

        request.on("end", () => {
            const data = JSON.parse(Buffer.concat(body).toString());

            VotingApp.getPoll(data.id_pk)
                .then(function (resolve) {
                    let poll = resolve;
                    poll.getOptionsArray()
                        .then(function (resolve) {
                            const optionsArray = resolve;
                            const option = optionsArray.find(element => element.title == data.title);
                            option.addVote();
                            response.end();
                        })
                        .catch(function (reject) { console.log(reject); });
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--handle error--*/
    else {
        let alert = "Helytelen URL"
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(alert);
        response.end();
    }
}
//#endregion SERVER---------------------------------------------------------------------------------------

//#region generateHTML 
function generateHTML(p_id_pk) {
    return new Promise(function (mainResolve, mainreject) {

        VotingApp.getPoll(p_id_pk)
            .then(function (resolve) {
                let poll = resolve;
                poll.getOptionsArray()
                    .then(function (resolve) {
                        let optionsArray = resolve;

                        let firstPart =
                            `<!DOCTYPE html>
                            <html lang="hu">
                            <head>
                            <meta charset="UTF-8">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">

                            <link rel="stylesheet" href="http://www.localhost:3000/style.css">

                            <title>${decodeURIComponent(poll.title)}</title>
                            </head>

                            <body>      
      
                            <div class="container">                      
                            <main>
                            <h2>${poll.title}</h2><br/>
                            <div class="uniform" id="linkIco" onclick="copyToClipBoard()" title="Meghívó Link Másolása">🔗</div>
                            <br />`;

                        let secondPart = "";
                        for (i = 0; i < optionsArray.length; i = i + 1) {
                            secondPart = secondPart +
                                `<div class="optionDiv uniform"><span class="title">${optionsArray[i].title}</span><br><span class="numOfVotes">${optionsArray[i].numOfVotes}</span></div>`;
                        }
                        secondPart = secondPart +
                            `<p>Kattints a szavazáshoz!</p>
                            <a href="http://www.localhost:3000/"><div class="uniform">Átlépés Másik Szobába!</div></a>
                            </main>
                            </div>
                            <script src="http://www.localhost:3000/voting.js"></script>
                            </body>
                            </html>`;

                        let htmlContent = firstPart + secondPart;

                        mainResolve(htmlContent);
                    })
                    .catch((reject) => mainreject(reject));
            })
            .catch((reject) => mainreject(reject));
    });
}
//#endregion GENERATE HTML---------------------------------------------------------------------------------------

/*--querystring to json/object--*/
function parser(query) {
    var parsed = JSON.parse('{"' + decodeURI(query.replace(/&/g, "\",\"").replace(/=/g, "\":\"").replace(/\+/g, " ")) + '"}')
    return parsed;
}
