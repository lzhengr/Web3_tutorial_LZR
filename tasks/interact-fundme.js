const { task } = require("hardhat/config")


task("interact-fundme","interact fundme conract")
.addParam("addr","fundme contract address")
.setAction(async(args,hre) => {
    const fundMeFactory = ethers.getContractFactory("FundMe")
    const fundMe = (await fundMeFactory).attach(args.addr);
    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners();
    // fund constract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.01")})
    await fundTx.wait()
    // check balance of constract 
    const balanceOfConstract = await ethers.provider.getBalance(fundMe.target);
    console.log(`Balance of the constract is ${balanceOfConstract}`)
    // fund constract with second account
    const fundTx_second = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.001")})
    await fundTx_second.wait()
    // check balance of constract
    balanceOfConstractAfterSecond = await ethers.provider.getBalance(fundMe.target);
    console.log(`Balance of the constract is ${balanceOfConstractAfterSecond}`)
    // check mappings fundersToAmount
    const firstAccountbalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address);
    const secondAccountbalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address);

    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountbalanceInFundMe}`)
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountbalanceInFundMe}`)
})

module.exports = {}