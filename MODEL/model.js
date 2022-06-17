//#region MODULES
const mysql = require("mysql");
//#endregion MODULES


//#region CLASSES
const VotingApp = class {
    /*--properties--*/
    static dataBase = null;
    static dbConfig = {
        host: "remotemysql.com",
        port: 3306,
        database: "T0KML4uumK",
        user: "T0KML4uumK",
        password: "7Xah2M7CBF"
    };
    /*--constructors--*/
    constructor() { }

    /*--methods--*/
    static connectToDataBase() {
       VotingApp.dataBase = mysql.createConnection(VotingApp.dbConfig);

       VotingApp.dataBase.connect(function (err) {                           //error handling while connecting
            if (err) {
                console.log('error when connecting to db:', err);
                setTimeout(connectToDataBase, 2000);                //introduce a delay before attempting to connect again, to avoid a hot loop, and to allow our node script to process asynchronous requests in the meantime.
            }
        });

       VotingApp.dataBase.on('error', function (err) {                       //error handling while connected
            console.log('error while connected to db', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {          //connection to the mysql server is usually lost due to either server restart, or a connnection idle timeout.
                connectToDataBase();
            }
            else {
                console.log(err);
            }
        });
    
    };

    static getPolls(p_UUId) {
        return new Promise(function (resolve, reject) {
            let pollsArray = [];
            const sqlCommand = `SELECT * FROM POLLS where UUId="${p_UUId}" OR UUId="0";`
            VotingApp.dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    for (let row of result) {
                        const poll = new Poll(row.id_pk, row.title, row.UUId);
                        pollsArray.push(poll);
                    }
                    resolve(pollsArray);
                }
            });
        });
    }
    static getPollsSearched(p_UUId, p_searchTerm) {
        return new Promise(function (resolve, reject) {
            let pollsArray = [];
            const sqlCommand = `SELECT * FROM POLLS where (UUId="${p_UUId}" OR UUId="0") AND
                title REGEXP '^${p_searchTerm}';`
            VotingApp.dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    for (let row of result) {
                        const poll = new Poll(row.id_pk, row.title, row.UUId);
                        pollsArray.push(poll);
                    }
                    resolve(pollsArray);
                }
            });
        });
    }
    static getPoll(p_id_pk) {
        return new Promise(function (resolve, reject) {
            const sqlCommand = `SELECT * FROM POLLS where id_pk=${p_id_pk};`;
            VotingApp.dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    let row = result[0];
                    const poll = new Poll(row.id_pk, row.title, row.UUId);
                    resolve(poll);
                }
            });
        });
    }
    static addPoll(p_title, p_UUId) {
        return new Promise(function (resolve, reject) {
            const sqlCommand = `INSERT INTO POLLS (title,UUId) values ("${p_title}","${p_UUId}");`;
            VotingApp.dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    console.log("Poll added.");
                    const id = result.insertId;
                    const poll = new Poll(id, p_title, p_UUId);
                    resolve(poll);
                }
            });
        });
    }
    static removePoll(p_id_pk) {
        const sqlCommand = `DELETE FROM POLLS where id_pk="${p_id_pk}";`;
        VotingApp.dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else console.log("Poll removed.");
        });
    }
}

const Poll = class {
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
    getOptions() {
        const id = this.id_pk;
        return new Promise(function (resolve, reject) {
            let optionsArray = [];
            const sqlCommand = `SELECT * FROM OPTIONS WHERE id_fk=${id};`;
            VotingApp.dataBase.query(sqlCommand, function (err, result) {
                if (err) reject(err);
                else {
                    for (let row of result) {
                        const option = new Option(row.id_fk, row.title);
                        option.numOfVotes = row.numOfVotes;
                        optionsArray.push(option);
                    }
                    resolve(optionsArray);
                }
            });
        });
    }
    addOption(p_title, p_numOfVotes = 0) {
        const sqlCommand = `INSERT INTO OPTIONS values ("${this.id_pk}","${p_title}",${p_numOfVotes});`;
        const id = this.id_pk;
        VotingApp.dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else {
                console.log("Option added.");
            }
        });
    }
    removeOptions() {
        const sqlCommand = `DELETE FROM OPTIONS where id_pk="${this.id_pk}";`;
        VotingApp.dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else console.log("Options removed.");
        });
    }
}

const Option = class {
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
        const sqlCommand = `UPDATE OPTIONS SET numOfVotes = numOfVotes + 1 WHERE id_fk=${this.id_fk} AND title="${this.title}"`;
        VotingApp.dataBase.query(sqlCommand, function (err) {
            if (err) throw err;
            else console.log("Vote added.");
            this.numOfVotes++;
        });
    }
}
//#endregion CLASSES---------------------------------------------------------------------------------------

module.exports = VotingApp, Poll, Option;
