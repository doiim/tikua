// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MyToken is ERC1155 {
    constructor() ERC1155("") {
        _mint(msg.sender, 0, 100, "");
        _mint(msg.sender, 1, 100, "");
        _mint(msg.sender, 2, 100, "");
    }
}