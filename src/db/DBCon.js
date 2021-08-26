const mysql = require('mysql')
let db = {}

db.connection = function () {
    let connection = mysql.createConnection({
        host: "localhost",
        port: "3306",
        user: "root",
        password: "12345678",
        database: "faucet"
    })
    connection.connect(function(err){
        if(err){
            console.log(err);
            return
        }
    })
    return connection
}
db.insert = function(connection,sql,paras,callback){
    connection.query(sql,paras,function(err,results,fields){
        if(err) throw err;
        callback(results)
    })
}
db.close = function (connection) {
    connection.end(function (err) {
        if (err) {
            return;
        } else {
            console.log('链接关闭')
        }
    })
}

module.exports = db;

