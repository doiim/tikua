// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyToken is ERC721 {
    constructor() ERC721("MyToken", "MTK") {
        _safeMint(msg.sender, 0);
        _safeMint(msg.sender, 1);
        _safeMint(msg.sender, 2);
    }
}