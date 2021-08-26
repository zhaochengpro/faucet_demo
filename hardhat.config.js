require("@nomiclabs/hardhat-web3")
require("@nomiclabs/hardhat-ethers")

const {testnet} = require('./network')
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  //编译版本
  compilers:[{
    version:"0.8.0"
  },{
    version:"0.8.4"
  }],
  
  //BNB测试网
  networks:{
    bnb_testnet: testnet,
  }
};
