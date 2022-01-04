//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC721.sol";

/**
 * @title A contract to use ERC721 with AccessControl
 * @author Me
 */
contract ERC721WithAccessControl is ERC721, AccessControl {
    /// Current token id
    uint256 public tokenId;
    /// Constant for minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mints new ERC721 token then sets it's uri
     * @param tokenOwner The owner of the minted token
     * @param tokenURI The URI of the minted token
     */
    function createItem(address tokenOwner, string memory tokenURI) external {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "You must have minter role to mint"
        );
        _mint(tokenOwner, tokenId);
        _setTokenURI(tokenId++, tokenURI);
    }
}
