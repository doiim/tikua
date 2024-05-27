// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
  // Store the current count
  uint256 public count;
  address public dapp;

  // The contractor receive the DAPP contract parameter.
  // It serves as a guarantee that only your Cartesi Machine will be able to increase the count
  constructor(address _dapp){
    dapp = _dapp;
  }

  // Function to increment the counter
  function increment() public {
    require(msg.sender == dapp, 'Should only be called by the dapp contract.');
    count++;
  }

  // Function to get the current count (view function, doesn't modify state)
  function getCount() public view returns (uint256) {
    return count;
  }
}