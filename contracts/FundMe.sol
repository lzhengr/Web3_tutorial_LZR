//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";


// 1.创建一个收款函数
// 2.记录投资人并且查看
// 3.在锁定期内，达到目标值，生产商可以提款
// 4.在锁定期内，达到目标值，投资人可以退款

contract FundMe {
    AggregatorV3Interface internal dataFeed;
    mapping(address => uint256) public fundersToAmount;
    uint256 MIN_VAL = 1 * 10 ** 18; //wei
    uint256 constant TARGET = 4500 * 10 ** 18;
    address public  owner;
    uint256 public deploymentTimestamp;
    uint256 public locktime;
    address public erc20Addr;
    bool public getFundSuccess = false;

    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MIN_VAL, "you must send at least 1 wei");
        require(block.timestamp < deploymentTimestamp + locktime,"window is closed");
        fundersToAmount[msg.sender] += msg.value;
    }

    /**
     * Network: Sepolia
     * Aggregator: BTC/USD
     * Address: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
     */
    constructor(uint256 _locktime) {
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        // msg block 系统变量
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        locktime = _locktime;
    }

    /**
     * Returns the latest answer.
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }
    
    function convertEthToUsd(uint256 ethAmount) public  view  returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return  ethAmount * ethPrice / (10 ** 8);
    }

    function getFund() external windowClose onlyOwner{
        require(convertEthToUsd(address(this).balance) >= TARGET,"Target is not reached");
        // transfer: transfer ETH and revert if tx failed
        // payable (owner).transfer(address(this).balance);
        // send: transfer ETH and return false if tx failed
        // bool suss = payable (msg.sender).send(address(this).balance)
        // require(suss,"tx failed");
        // call: transfer ETH with data return value of function and bool
        bool suss;
        (suss, ) = payable(msg.sender).call{value:address(this).balance}("");
        require(suss,"tx failed");
        getFundSuccess = true;
    }

    function transferOwnership(address newOwner) public  {
        require(msg.sender == owner,"only the owner can do this action!");
        owner = newOwner;
    }

    function refund() external windowClose{
        require(convertEthToUsd(address(this).balance) < TARGET,"Target is reached");
        require(fundersToAmount[msg.sender] != 0, "there is no fund for you!");
        bool suss;
        (suss, ) = payable(msg.sender).call{value:fundersToAmount[msg.sender]}("");
        require(suss,"tx failed");
        fundersToAmount[msg.sender] = 0;
    }

    function setFunderToAmount(address funder, uint256 amountToUpdate) external  {
        require(msg.sender == erc20Addr, "you do not have permission to call this function");
        fundersToAmount[funder] = amountToUpdate;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner{
        erc20Addr = _erc20Addr;
    }

    modifier windowClose() {
        require(block.timestamp > deploymentTimestamp + locktime,"window is not closed");
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "only the owner can do this action!");
        _;
    }
}
