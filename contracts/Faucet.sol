// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external returns (uint256);
    function decimals() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    event Transfer(address indexed from, address indexed to, uint256 value);
}

contract Faucet {
    uint256 public immutable tokenAmount;

    uint256 public constant waitTime = 5 seconds;

    uint256 public requestCount = 0;
    
    IERC20 public token;

    mapping(address => uint256) lastAccessTime;

    constructor(address token_) {
        require(token_ != address(0));
        token = IERC20(token_);
        tokenAmount = 100 * 10**token.decimals();
    }
    
    event RequestTokens(address indexed sender, address indexed recipient);

    /*
        A function to request some tokens
        @param address sender
        @param address recipent
     */
    function requestTokens(address sender, address recipient) public {
        require(allowedToWithdraw(recipient));
        token.transferFrom(sender, recipient, tokenAmount);
        lastAccessTime[recipient] = block.timestamp + waitTime;
        requestCount += 1;
        emit RequestTokens(sender, recipient);
    }

    /*
        This function is to get current Block's height
        @return uint256
     */
    function getBlocks() public view returns (uint256) {
        return block.number;
    }

    /*
        This function is to get balance that param address
        @param address account
        @return uint256
     */
    function balanceOf(address account) public returns (uint256) {
        return token.balanceOf(account);
    }

    /*
        This function is to get Token decimal
        @return uint256
     */
    function getTokenDecimal() public view returns (uint256) {
        return token.decimals();
    }

    /*
        This function is to get token total supply
        @return uint256
     */
    function totalSupply() public view returns (uint256) {
        return token.totalSupply();
    }

    /*
        This function is to caculate the interval of an address
        @param address recipient
        @return uint256
     */
    function getLastAccessTime(address recipient) public view returns (uint256){
        return lastAccessTime[recipient];
    }

    function allowedToWithdraw(address account) public view returns (bool) {
        if (lastAccessTime[account] == 0) {
            return true;
        } else if (block.timestamp >= lastAccessTime[account]) {
            return true;
        }
        return false;
    }
}
