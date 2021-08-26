
const fs = require('fs')
const path = require('path')
const http = require('http')
const AirDropJson = require('../artifacts/contracts/AirDrop.sol/AirDrop.json')
const FaucetJson = require('../artifacts/contracts/Faucet.sol/Faucet.json')
const SelfDropJson = require('../artifacts/contracts/SelfDrop.sol/SelfDrop.json')


//Create a async function to  store the token info on the local database
let storeToken = (uri, port, path, data) => {
  return new Promise((resolve, reject) => {
    data = JSON.stringify(data)
    const options = {
      hostname: uri,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      res.on("data", (data) => {
        console.log(data)
        resolve(data)
      })
    })
    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
      reject(data)
    });

    // Write data to request body
    req.write(data);
  })
}

let tokenInfo = async (token, faucet, provider) => {
  //totalSupply
  const totalSupply = await faucet.connect(provider).totalSupply();
  //tokenDemical
  const tokenDecimal = await faucet.connect(provider).getTokenDecimal();
  //surplusTokenAmount
  const surplusTokenAmount = await faucet.connect(provider).callStatic.balanceOf(provider.address);
  //waitTime
  const waitTime = await faucet.connect(provider).waitTime();
  //tokenAmount
  const tokenAmount = await faucet.connect(provider).tokenAmount();
  return new Promise((resolve, reject) => {
    resolve({
      tokenId: token.address,
      totalSupply: totalSupply.toString(),
      tokenAmount: tokenAmount.toString(),
      surplusTokenAmount: surplusTokenAmount.toString(),
      tokenDecimal: tokenDecimal.toString(),
      waitTime: waitTime.toString()
    })
  })

}

let main = async () => {
  const delployers = await ethers.getSigners();
  console.log(
    "Deploying contracts with the account:",
    delployers[0].address
  );
  console.log("Account balance:", (await delployers[0].getBalance()).toString());
  const Token = await ethers.getContractFactory("TestToken");
  const Faucet = await ethers.getContractFactory("Faucet");
  const AirDrop = await ethers.getContractFactory("AirDrop");
  const SelfDrop = await ethers.getContractFactory("SelfDrop");
  fs.writeFileSync(path.resolve(__dirname, "../src/abi/Faucet.json"), JSON.stringify(FaucetJson.abi))
  fs.writeFileSync(path.resolve(__dirname, "../src/abi/AirDrop.json"), JSON.stringify(AirDropJson.abi))
  fs.writeFileSync(path.resolve(__dirname, "../src/abi/SelfDrop.json"), JSON.stringify(SelfDropJson.abi))

  //deploy token
  const token = await Token.deploy()
  await token.deployed();
  const faucet = await Faucet.deploy(token.address);
  await faucet.deployed();
  const airDrop = await AirDrop.deploy(token.address);
  await airDrop.deployed();
  const selfDrop = await SelfDrop.deploy(token.address);
  await selfDrop.deployed();

  //approve faucet
  await token.tokenApprove(faucet.address, 10000000)

  let transferAmount = "1000000000000000000000";
  const transferData = await token.transfer(selfDrop.address, transferAmount);
  const transferData1 = await token.transfer(airDrop.address, transferAmount);
  let tokenInfoObj = await tokenInfo(token, faucet, delployers[0])
  await storeToken("localhost", 3001, "/addToken", tokenInfoObj);
  console.log("token store over");
  await storeToken("localhost", 3001, "/addClaimed", {
    txId: transferData.hash,
    from: delployers[0].address,
    to: selfDrop.address,
    amount: transferAmount,
    date: new Date().getTime(),
    tokenId: token.address
  });
  console.log("self Drop store over");
  await storeToken("localhost", 3001, "/addClaimed", {
    txId: transferData1.hash,
    from: delployers[0].address,
    to: airDrop.address,
    amount: transferAmount,
    date: new Date().getTime(),
    tokenId: token.address
  });
  console.log("airDrop store over");
  fs.writeFileSync(path.resolve(__dirname, "../src/address.js"),
    `export default {faucet:${JSON.stringify(faucet.address)},
  token:${JSON.stringify(token.address)},airDrop:${JSON.stringify(airDrop.address)},selfDrop:${JSON.stringify(selfDrop.address)}}`);
  console.log(faucet.address, faucet.signer.address);
  //get token info and store to the mysql

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });