const { ethers, deployments, network } = require("hardhat")
const {developmentChains} = require("../../helper-hardhat-config")


developmentChains.includes(network.name)
? describe.skip
: describe("test fundme contract",async function(){

    let fundme
    let firstAccount
    beforeEach(async function() {
        await deployments.fixture("all") 
        firstAccount = (await getNamedAccounts()).firstAccount
        const fundmeDeployments = await deployments.get("FundMe")
        fundme = await ethers.getContractAt("FundMe",fundmeDeployments.address)
    })

    // test fund and getFund successfully
    // test fund and refund successfully

    it("test fund and getFund successfully",
        async function () {
            // make sure target reached
            await fundme.fund({value:ethers.parseEther("0.01")})
            await new Promise(resolve => setTimeout(resolve,181 * 1000))
            // make sure we can get receipt
            const getFundTx = await fundme.getFund()
            const getFundReceipt = await getFundTx.wait()
            expect(getFundReceipt).to.be.emit(fundme,"FundWithDrawByOwner").withArgs(ethers.parseEther("0.01"))
        }
    )

    it("test fund and refund successfully",
        async function () {
            // make sure target not reached
            await fundme.fund({value:ethers.parseEther("0.0001")})
            // make sure window closed
            await new Promise(resolve => setTimeout(resolve,181 * 1000))
            // make sure we can get receipt
            const reFundTx = await fundme.refund()
            const reFundReceipt = await reFundTx.wait()
            expect(reFundReceipt).to.be.emit(fundme,"RefundByFunder").withArgs(firstAccount.parseEther("0.0001"))
        }
    )
})