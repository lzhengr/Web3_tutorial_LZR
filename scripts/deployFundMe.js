
// import ethers.js
// create main function
// execute main function

const {ethers} = require("hardhat")
require("@chainlink/env-enc").config()

async function main() {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    // deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    console.log(`contarct has been deployed successfully, contract address is ${fundMe.target}`)

    // verify fundme
    // if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_APIKEY) {
    //     await fundMe.deploymentTransaction().wait(5)
    //     console.log("waiting for 5 confirmations")
    //     await verifyFundMe(fundMe.target,[300])
    // }else {
    //     console.log("verification skipped")
    // }

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
}

async function verifyFundMe(fundMeAddr, args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
      });
}

main().then().catch((error) => {
    console.error(error)
    process.exit(0)
})
