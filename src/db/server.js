const express = require('express')
const DB = require('./DBCon')
const bodyParser = require('body-parser')
const app = express();
const connection = DB.connection();

app.use(express.json())
app.use(express.urlencoded({ extended: false }));

//set the cross-origin
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
})
app.get('/getIndexInfo', (req, res) => {
    const tokenId = req.query.tokenId;
    const airDropId = req.query.airDropId;
    const selfDropId = req.query.selfDropId;
    DB.insert(connection, "select count(*) funded, sum(amount) amount from claimed c where tokenId = ? and not c.from in (?,?)", [tokenId,airDropId,selfDropId], (data) => {
        res.status(200).send(data).end();
    })
})
app.post('/addClaimed', (req, res) => {
    console.log(req.body)
    DB.insert(connection, "INSERT INTO claimed SET ?", req.body, (data) => {
        res.status(200).send("ok")
    })
})
app.post('/addClaimedByAirDrop', (req, res) => {
    let tos = req.body['tos[]'];
    delete req.body['tos[]'];
    console.log(req.body);
    for (let i = 0; i < tos.length; i++) {
        req.body.to = tos[i]
        DB.insert(connection, "INSERT INTO claimed SET ?", req.body, (data) => {
            res.status(200).send("ok")
        })
    }

})

//analyze data
app.get('/moreThingAddress', (req, res) => {
    let address = req.query.address;
    DB.insert(connection, "SELECT SUM(amount) claimedTotal, SUM(amount)/COUNT(*) aca, (SELECT date FROM claimed cl WHERE cl.to = ? ORDER BY date DESC LIMIT 0,1) lastTime FROM claimed c WHERE c.to = ?", 
    [address,address], (data) => {
        res.status(200).send(data)
    })
})
app.get('/getTop', (req, res) => {
    const airDropId = req.query.airDropId;
    const selfDropId = req.query.selfDropId; 
    DB.insert(connection, "SELECT c.to address, SUM(amount) claimedTotal,MAX(date) lastTime FROM claimed c WHERE NOT c.from IN (?,?) GROUP BY c.to ORDER BY SUM(amount)  DESC LIMIT 0,3", 
    [airDropId,selfDropId], (data) => {
        res.status(200).send(data)
    })
})


// token database
app.post('/addToken', (req, res) => {
    DB.insert(connection, "INSERT INTO tokens SET ?", req.body, (data) => {
        res.status(200).send("ok")
    })
})
app.get('/getTokenInfo', (req, res) => {
    let tokenId = req.query.tokenId
    DB.insert(connection, "SELECT * FROM tokens WHERE tokenId=?", tokenId, (data) => {
        res.status(200).send(data)
    })
})
app.post('/updateToken', (req, res) => {
    let surplusTokenAmount = req.body.surplusTokenAmount;
    let tokenId = req.body.tokenId;
    DB.insert(connection, "update tokens set surplusTokenAmount = ? where tokenId = ?",
        [surplusTokenAmount, tokenId], (data) => {
            res.status(200).send(data)
        })
})

//airdrop
app.get('/getAirDropInfo', (req, res) => {
    let tokenId = req.query.tokenId
    let airDropAddress = req.query.airDropAddress
    DB.insert(connection, "SELECT sum(amount) - (SELECT COALESCE(sum(amount),NULL,0,1) a FROM claimed c WHERE c.from=? AND NOT c.amount is NULL) totalAmount,"+
    "(select tokenDecimal from tokens where tokenId=?) tokenDecimal,"+
    "(select count(*) from claimed c where c.from=?) count FROM claimed c WHERE c.to=?", [airDropAddress,tokenId,airDropAddress,airDropAddress], 
    (data) => {
        res.status(200).send(data)
    })
})
//self drop
app.get('/getSelfDropInfo', (req, res) => {
    let tokenId = req.query.tokenId
    let selfDropAddress = req.query.selfDropAddress
    DB.insert(connection, "SELECT sum(amount) - (SELECT COALESCE(sum(amount),NULL,0,1) a FROM claimed c WHERE c.from=? AND NOT c.amount is NULL) totalAmount,"+
    "(select tokenDecimal from tokens where tokenId=?) tokenDecimal,"+
    "(select count(*) from claimed c where c.from=?) count FROM claimed c WHERE c.to=?", [selfDropAddress,tokenId,selfDropAddress,selfDropAddress], 
    (data) => {
        res.status(200).send(data)
    })
})

app.listen(3001, () => {
    console.log('listening in 3001 port....')
});