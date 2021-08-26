const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");



describe("Faucet", function () {

  it("Faucet test", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    const Faucet = await ethers.getContractFactory("Faucet");
    const token = await Token.deploy()
    await token.deployed();
    console.log("token address:", token.address)
    const faucet = await Faucet.deploy(token.address);
    await faucet.deployed();
    console.log("faucet address:", faucet.address)
    await token.tokenApprove(faucet.address, 100000)

    const balance = await faucet.callStatic.balanceOf(owner.address)
    console.log(owner.address + " balance is ", balance)


    await faucet.connect(addr1).requestTokens(owner.address, addr1.address)
    const balance1 = await faucet.callStatic.balanceOf(addr1.address)
    console.log(addr1.address + " balance is ", balance1)

    const balance2 = await faucet.callStatic.balanceOf(owner.address)
    console.log(owner.address + " balance is ", balance2)

  })
  it("block info", async () => {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    const Faucet = await ethers.getContractFactory("Faucet");
    const token = await Token.deploy()
    await token.deployed();
    console.log("token address:", token.address)
    const faucet = await Faucet.deploy(token.address);
    await faucet.deployed();
    console.log("faucet address:", faucet.address)
    await token.tokenApprove(faucet.address, 100000)

    await faucet.connect(addr1).requestTokens(owner.address, addr1.address)

    const blocks = await faucet.callStatic.getBlocks();
    console.log("blocks:", blocks.toString(10))
    const totalSupply = await faucet.callStatic.totalSupply();
    console.log("totalSupply:", totalSupply.toString(10))
    const requestCount = await faucet.callStatic.requestCount();
    console.log("requestCount:", requestCount.toString(10))
    const tokenDecimal = await faucet.callStatic.getTokenDecimal();
    console.log("tokenDecimal:", tokenDecimal.toString(10))
    console.log("totalSupplyFormat:", totalSupply / (10 ** tokenDecimal))
  })

  it("test interval", async () => {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    const Faucet = await ethers.getContractFactory("Faucet");
    const token = await Token.deploy()
    await token.deployed();
    const faucet = await Faucet.deploy(token.address);
    await faucet.deployed();
    await token.tokenApprove(faucet.address, 100000)
    await faucet.connect(addr1).requestTokens(owner.address, addr1.address);
  })

  it("evnt test", async () => {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    const Faucet = await ethers.getContractFactory("Faucet");
    const token = await Token.deploy()
    await token.deployed();
    const faucet = await Faucet.deploy(token.address);
    await faucet.deployed();
    await token.tokenApprove(faucet.address, 100000)

    let faucetEvent = new Promise((resolve, reject) => {
      // faucet.on("pending", (from, to, event) => {
      //   event.removeListener()
      //   resolve({
      //     from: from,
      //     to: to,
      //   });
      //   setTimeout(() => {
      //     reject(new Error('timeout'));
      //   }, 60000)
      // })
      ethers.provider.on("block",(blockNumber) => {
        resolve(blockNumber)
      })
    })

    await faucet.connect(addr1).requestTokens(owner.address, addr1.address)
    const blockNumber = await faucetEvent
    await faucet.connect(addr1).requestTokens(owner.address, addr2.address)
    console.log(blockNumber)
  })
  it("airdrop test", async () => {
    const [owner,account1,account2] = await ethers.getSigners();
    const tokenAbi = await ethers.getContractFactory("TestToken");
    const airDropAbi = await ethers.getContractFactory("AirDrop");
    const token = await tokenAbi.deploy();
    const airDrop = await airDropAbi.deploy(token.address);
    await token.transfer(airDrop.address,"1000000000000000000000");
    const balance = await token.balanceOf(airDrop.address)
    console.log(balance.toString(10));
    await airDrop.airDrop([account1.address,account2.address]);
    const balance1 = await token.bala 
    nceOf(account1.address);
    console.log(balance1.toString(10));
    const balance2 = await token.balanceOf(account2.address);
    console.log(balance2.toString(10));
  })
  it("selfDrop test", async () => {
    const [owner,account1,account2] = await ethers.getSigners();
    const tokenAbi = await ethers.getContractFactory("TestToken");
    const selfDropAbi = await ethers.getContractFactory("SelfDrop");
    const token = await tokenAbi.deploy();
    const selfDrop = await selfDropAbi.deploy(token.address);
    await token.transfer(selfDrop.address,"1000000000000000000000");

    const balance = await selfDrop.balance();
    console.log(balance.toString(10));
    await selfDrop.claim();
    const balance1 = await selfDrop.getCount();
    console.log(balance1.toString(10));
    await selfDrop.connect(account2).claim();
    const balance2 = await selfDrop.getCount();
    console.log(balance2.toString(10));
  })
});
