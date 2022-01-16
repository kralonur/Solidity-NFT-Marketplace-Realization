//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title A contract to use ERC1155 with AccessControl
 * @author Me
 */
contract ERC1155WithAccessControl is ERC1155, AccessControl {
    /// Current token id
    uint256 public tokenId;
    /// Constant for minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory uri) ERC1155(uri) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Mints new ERC1155 token
     * @param tokenOwner The owner of the minted token
     */
    function createItem(address tokenOwner) external {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "You must have minter role to mint"
        );
        _mint(tokenOwner, tokenId++, 1, "");
    }
}
