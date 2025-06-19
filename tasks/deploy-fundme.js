const { task } = require("hardhat/config")


task("deploy-fundme","deploy fundme conract").setAction(async(args,hre) => {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    // deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    console.log(`contarct has been deployed successfully, contract address is ${fundMe.target}`)
})

module.exports = {}