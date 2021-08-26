// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/Counters.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external;
    function decimals() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract SelfDrop {
    using Counters for Counters.Counter;
    Counters.Counter private _counter;

    IERC20 _token;

    mapping (address => bool) _claimed;

    event RewardClaimed(address indexed account, uint256 counter); 

    constructor(address addr) {
        _token = IERC20(addr);
        _counter.increment();
    }

    function balance() public view returns (uint256) {
        return _token.balanceOf(address(this));
    }

    function getCount() public view returns (uint256) {
        return _counter.current();
    }

    function claim() public {
        require(!_claimed[msg.sender]);
        _token.transfer(msg.sender, 100 * 10 ** _token.decimals());
        _claimed[msg.sender] = true;
        _counter.increment();
        emit RewardClaimed(msg.sender, _counter.current());
    }
}
