import address from './address'
const faucetABI = require('./abi/faucet.json');
const airDropABI = require('./abi/AirDrop.json');
const selfDropABI = require('./abi/SelfDrop.json');
const { ethers, Contract } = require('ethers');
const {mnemonic} = require('./secrets.json')
//获取钱包地址（provider用于对交易进行签名

let provider = new ethers.providers.Web3Provider(window.web3.currentProvider)
let wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider)
//通过合约地址和合约ABI获取合约

let faucetContract = new Contract(address.faucet,faucetABI)
let selfDropContract = new Contract(address.selfDrop,selfDropABI);
let airDropContract = new Contract(address.airDrop,airDropABI)

export{
    faucetContract,
    selfDropContract,
    airDropContract,
    wallet,
    provider,
}