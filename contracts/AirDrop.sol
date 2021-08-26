// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external;
    function decimals() external view returns (uint256);
}


contract AirDrop is Ownable {
    IERC20 _token;

    mapping (address => bool) droped;

    event AirDrop(address indexed sender, address[] addrs);

    constructor(address addr) {
        _token = IERC20(addr);
    }

    function airDrop(address[] memory addrs) public onlyOwner {
        uint256 nAddr = addrs.length;
        for (uint256 i = 0; i < nAddr; i++) {
            require(!droped[addrs[i]]);
            _token.transfer(addrs[i], 100 * 10 ** _token.decimals());
            droped[addrs[i]] = true;
        }
        emit AirDrop(msg.sender, addrs);
    }
}
