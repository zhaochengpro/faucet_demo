//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is IERC20, ERC20, Ownable {
    constructor() ERC20("Test Token", "TT") {
        _mint(_msgSender(), 1_000_000_000 * 10 ** decimals());
    }

    function tokenApprove(address spender, uint256 amount) public returns (bool) {
        return approve(spender, amount * 10 ** decimals());
    }
}
