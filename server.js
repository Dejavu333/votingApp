//#region MODULES
const http = require("http");
const fs = require("fs");
// const url = require("url");
// const mysql = require("mysql");
const VotingApp = require("./MODEL/model.js");
//#endregion MODULES---------------------------------------------------------------------------------------

//#region SQL
VotingApp.connectToDataBase();
//#endregion SQL---------------------------------------------------------------------------------------

//#region APPLICATIONSERVER
let server;
server = http.createServer(connect);
server.listen(process.env.PORT || 3000);

/*--routing--*/     
function connect(request, response) { //no error handling on some routes

    /*--serving style.css--*/
    if (request.url == "/style.css" && request.method == "GET") {
        fs.readFile("./VIEW/style.css", null, function (error, data) {
            response.writeHead(200, { "Content-Type": "text/css" });
            response.write(data);
            response.end();
        });
    }

    /*--serving pollSelectionView.html--*/
    else if (request.url == "/" || request.url == "/pollSelectionView.html" && request.method == "GET") {

        response.setHeader("Content-Type", "text/html");
        fs.readFile("./VIEW/pollSelectionView.html", null, function (error, data) {
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

    /*--serving pollCreationView.html--*/
    else if (request.url == "/pollCreationView.html" && request.method == "GET") {

        response.setHeader("Content-Type", "text/html");
        fs.readFile("./VIEW/pollCreationView.html", null, function (error, data) {
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

    /*--serving pollView.html--*/
    else if (request.url.match(/poll[0-9]+/g) !== null && request.method == "GET") {

        response.setHeader("Content-Type", "text/html");
        fs.readFile("./VIEW/pollView.html", null, function (error, data) {
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

    /*--getPollsInc--*/
    else if (request.url == "/getPollsInc" && request.method == "POST") {

        processIncomingData(request,"fetch").then(function (resolve, reject) {
            const data = resolve;
            const UUId = data.UUId;

            VotingApp.getPolls(UUId)
                .then(function (resolve) {
                    const pollsArray = resolve;
                    response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://www.localhost:3000" });
                    response.write(JSON.stringify(pollsArray));
                    response.end();
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--getPollsSearchedInc--*/
    else if (request.url == "/getPollsSearchedInc" && request.method == "POST") {

        processIncomingData(request,"fetch").then(function (resolve, reject) {
            const data = resolve;
            const UUId = data.UUId;
            const searchTerm = data.searchTerm;

            VotingApp.getPollsSearched(UUId, searchTerm)
                .then(function (resolve) {
                    const pollsArray = resolve;
                    response.writeHead(200, { "Content-Type": "application/json ", "Access-Control-Allow-Origin": "http://www.localhost:3000" });
                    response.write(JSON.stringify(pollsArray));
                    response.end();
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--getPollInc--*/
    else if (request.url == "/getPollInc" && request.method == "POST") {

        processIncomingData(request,"fetch").then(function (resolve, reject) {
            const data = resolve;

            VotingApp.getPoll(data.id_pk)
                .then(function (resolve) {
                    const poll = resolve;
                    poll.getOptions()
                        .then(function (resolve) {
                            const optionsArray = resolve;
                            const data = {
                                poll : poll,
                                options : optionsArray
                            }
                            const stringified = JSON.stringify(data);
                            response.writeHead(200,{"Content-Type": "application/json", "Access-Control-Allow-Origin": "http://www.localhost:3000" });
                            response.write(stringified);
                            response.end();
                        })
                        .catch(function (reject) { console.log(reject); })
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--addPollInc--*/
    else if (request.url == "/addPollInc" && request.method == "POST") {

        processIncomingData(request,"form").then(function (resolve, reject) {
            const data = resolve;

            VotingApp.addPoll(data.title, data.UUId)
                .then(function (resolve) {
                    const poll = resolve;
                    const optionTitles = Object.values(data);
                    for (i = 1; i < optionTitles.length - 1; i++) {
                        poll.addOption(optionTitles[i], 0);
                    }
                    response.setHeader("Content-Type", "text/html");
                    response.setHeader("Location", `http://www.localhost:3000/poll${poll.id_pk}?id=${poll.id_pk}`);
                    response.statusCode = 302;
                    response.end();
                })
                .catch(function (reject) { console.log(reject); });
        });
    }

    /*--addVoteInc--*/
    else if (request.url == "/addVoteInc" && request.method == "POST") {

        processIncomingData(request,"fetch").then(function (resolve, reject) {
            const data = resolve;

            VotingApp.getPoll(data.id_pk)
                .then(function (resolve) {
                    const poll = resolve;
                    poll.getOptions()
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
        const alert = "Helytelen URL"
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(alert);
        response.end();
    }
}
//#endregion APPLICATIONSERVER---------------------------------------------------------------------------------------

//#region DEFINE FUNCTIONS
/*--querystring to json/object--*/
function parser(query) {
    const parsed = JSON.parse('{"' + decodeURIComponent(query.replace(/&/g, "\",\"").replace(/=/g, "\":\"").replace(/\+/g, " ")) + '"}')
    return parsed;
}
/*--process incoming data--*/
function processIncomingData(request, p_type_s) {
    return new Promise(function (resolve, reject) {
        try {
            const body = [];
            request.on("data", (chunk) => {
                body.push(chunk);
            });

            request.on("end", () => {
                const buffered = Buffer.concat(body).toString();
                console.log("bejövő adatok:" + buffered);
                let processed;
                if (p_type_s == "fetch") {
                    processed = JSON.parse(decodeURIComponent(buffered));
                }
                else if (p_type_s == "form") {
                    processed = parser(buffered);
                }
                console.log(processed);
                resolve(processed);
            });
        }
        catch (error) { reject(error); }
    });
}
//#endregion DEFINE FUNCTIONS
