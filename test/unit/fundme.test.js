const { ethers, deployments } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const {developmentChains} = require("../../helper-hardhat-config")

!(developmentChains.includes(network.name))
? describe.skip
: describe("test fundme contract",async function(){

    let fundme
    let fundMeSecondAccount
    let firstAccount
    let secondAccount
    let mockV3Aggregator
    beforeEach(async function() {
        await deployments.fixture("all") 
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        const fundmeDeployments = await deployments.get("FundMe")
        fundme = await ethers.getContractAt("FundMe",fundmeDeployments.address)
        mockV3Aggregator = await deployments.get("MockV3Aggregator")
        // fundMeSecondAccount = await ethers.getContractAt("FundMe",secondAccount)
        fundMeSecondAccount= await ethers.getImpersonatedSigner(secondAccount);
    })

    it("test if the owner is msg.sender", async function() {
        // const [firstAccount] = await ethers.getSigners()
        // const fundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundme = await fundMeFactory.deploy(200)
        await fundme.waitForDeployment()
        assert.equal((await fundme.owner()),firstAccount)
    })

    it("test if the dataFeed is assigned conrrectly", async function() {
        // const fundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundme = await fundMeFactory.deploy(200)
        await fundme.waitForDeployment()
        assert.equal((await fundme.dataFeed()),mockV3Aggregator.address)
    })

    // fund,getFund,reFund
    // unit test for fund
    // window open, value greater then minimum value, fund balance
    it("window close, value greater then minimum, fund failed", async function() {
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        // value is greater minimum value
        await expect(fundme.fund({value: ethers.parseEther("0.1")})).to.be.revertedWith("window is closed")
    })
    it("window open, value is less then minimum, fund failed", async function() {
        // value is less minimum value
        await expect(fundme.fund({value: ethers.parseEther("0.00001")})).to.be.revertedWith("you must send at least 1 wei")
    })
    it("window open, value is greater then minimum, fund success", async function() {
        // value is greater minimum value
        await fundme.fund({value: ethers.parseEther("0.1")})
        const banlance = await fundme.fundersToAmount(firstAccount)
        expect(banlance).to.equal(ethers.parseEther("0.1"))
    })

    // unit test for getFund
    // only owner, window closed, target reached
    it("not owner, window closed, target reached, getFund failed", async function() {
        // make sure the target is reached
        await fundme.fund({value: ethers.parseEther("5")})
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        // await expect(fundMeSecondAccount.getFund()).to.be.revertedWith("only the owner can do this action!")
        await expect(fundme.connect(fundMeSecondAccount).getFund()).to.be.revertedWith("only the owner can do this action!")

    })
    it("window open, target reached, getFund failed", async function() {
        // make sure the target is reached
        await fundme.fund({value: ethers.parseEther("5")})
        await expect(fundme.getFund()).to.be.revertedWith("window is not closed")

    })
    it("window closed, target not reached, getFund failed", async function() {
        // make sure the target is not reached
        await fundme.fund({value: ethers.parseEther("0.01")})
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundme.getFund()).to.be.revertedWith("Target is not reached")
    })
    it("window closed, target reached, getFund success", async function() {
        // make sure the target is not reached
        await fundme.fund({value: ethers.parseEther("5")})
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundme.getFund()).to.emit(fundme,"FundWithDrawByOwner").withArgs(ethers.parseEther("5"))
    })

    // refund
    //window closed, target not reached, funder has balance
    it("window open, target not reached, funder has balance", async function() {
        // make sure the target is not reached
        await fundme.fund({value: ethers.parseEther("0.01")})
        await expect(fundme.refund()).to.be.revertedWith("window is not closed")
    })
    it("window closed, target reached, funder has balance", async function() {
        // make sure the target is not reached
        await fundme.fund({value: ethers.parseEther("10")})
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundme.refund()).to.be.revertedWith("Target is reached")
    })
    it("window closed, target not reached, funder has no balance", async function() {
        // make sure the target is not reached
        await fundme.fund({value: ethers.parseEther("0.1")})
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundme.connect(fundMeSecondAccount).refund()).to.be.revertedWith("there is no fund for you!")
    })
    it("window closed, target not reached, funder has balance", async function() {
        // make sure the target is not reached
        await fundme.fund({value: ethers.parseEther("0.1")})
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundme.refund()).to.emit(fundme,"RefundByFunder").withArgs(firstAccount,ethers.parseEther("0.1"))
    })


})