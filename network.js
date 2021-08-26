const {mnemonic} = require('./src/secrets.json')
module.exports = {
    //bnb test network
    testnet:{
        url: "https://data-seed-prebsc-1-s1.binance.org:8545",
        chainId: 97,
        gasPrice: 20000000000,
        accounts: {mnemonic: mnemonic}
      },
    ws_testnet_api:"wss://testnet-dex.binance.org/api/."
}