//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract ERC721 {
    /// Name of the token
    string private _name;
    /// Symbol of the token
    string private _symbol;

    // A mapping for storing address of the token
    mapping(uint256 => address) private _tokenOwner;

    // A mapping for storing token uris
    mapping(uint256 => string) private _tokenURI;

    // A mapping for storing balance of the address
    mapping(address => uint256) private _addressBalance;

    // A mapping for storing approved address of the token
    mapping(uint256 => address) private _tokenApproval;

    // A mapping for storing approvels from owner to operators
    mapping(address => mapping(address => bool)) private _operatorApproval;

    constructor(string memory tokenName, string memory tokenSymbol) {
        _name = tokenName;
        _symbol = tokenSymbol;
    }

    /**
     * @dev Emitted when token transferred
     * @param from The address token transferred from
     * @param to The address token transferred to
     * @param tokenId The id of transferred token
     */
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    /**
     * @dev Emitted when owner approves a token
     * @param owner The owner of the token
     * @param approved The address that owner approved
     * @param tokenId The id of approved token
     */
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );

    /**
     * @dev Emitted when owner enables or disables operator to manage all of its tokens
     * @param owner The owner of the token
     * @param operator The address that owner let's manage all of its tokens
     * @param approved The access of the operator
     */
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /**
     * @dev Modifier for checking if the token exists
     * @param tokenId The id of the token
     */
    modifier validToken(uint256 tokenId) {
        require(_tokenOwner[tokenId] != address(0), "Token does not exist");
        _;
    }

    /**
     * @dev Modifier for checking if the address is non-null
     * @param addressToCheck The address to check
     */
    modifier validAddress(address addressToCheck) {
        require(addressToCheck != address(0), "Address can't be null");
        _;
    }

    /// @dev see {_name}
    function name() external view returns (string memory) {
        return _name;
    }

    /// @dev see {_symbol}
    function symbol() external view returns (string memory) {
        return _symbol;
    }

    /// @dev see {_tokenURI}
    function tokenURI(uint256 tokenId)
        external
        view
        validToken(tokenId)
        returns (string memory)
    {
        return _tokenURI[tokenId];
    }

    /// @dev see {_addressBalance}
    function balanceOf(address owner)
        external
        view
        validAddress(owner)
        returns (uint256)
    {
        return _addressBalance[owner];
    }

    /// @dev see {_tokenOwner}
    function ownerOf(uint256 tokenId)
        external
        view
        validToken(tokenId)
        returns (address)
    {
        return _tokenOwner[tokenId];
    }

    /**
     * @dev Transfers the token from 'from' to 'to' using tokenId
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param tokenId The id of the token to transfer
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external validToken(tokenId) validAddress(to) {
        require(
            _canTransfer(tokenId),
            "Caller is not allowed to transfer this token"
        );
        require(
            _tokenOwner[tokenId] == from,
            "You can't transfer someone elses token"
        );

        _addressBalance[from] -= 1;
        _addressBalance[to] += 1;

        _tokenOwner[tokenId] = to;

        // Since the owner transferred the token
        _approve(address(0), tokenId);

        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev Checks if the sender can transfer given token
     * @param tokenId The id of the token to checks
     */
    function _canTransfer(uint256 tokenId) private view returns (bool) {
        address tokenOwner = _tokenOwner[tokenId];
        return
            msg.sender == tokenOwner ||
            _tokenApproval[tokenId] == msg.sender ||
            _operatorApproval[tokenOwner][msg.sender];
    }

    /// @dev see {_approve}
    function approve(address to, uint256 tokenId) external {
        require(
            msg.sender == _tokenOwner[tokenId] ||
                _operatorApproval[_tokenOwner[tokenId]][msg.sender],
            "You can't approve this token"
        );

        _approve(to, tokenId);
    }

    /**
     * @dev Approves the given token for 'to'
     * @param to The address of approval
     * @param tokenId The id of the token to approves
     */
    function _approve(address to, uint256 tokenId) private {
        _tokenApproval[tokenId] = to;
        emit Approval(_tokenOwner[tokenId], to, tokenId);
    }

    /// @dev see {_tokenApproval}
    function getApproved(uint256 tokenId)
        external
        view
        validToken(tokenId)
        returns (address)
    {
        return _tokenApproval[tokenId];
    }

    /**
     * @dev Gives control of all of the callers tokens to operator
     * @param operator The address of operator
     * @param approved The restriction of the operator
     */
    function setApprovalForAll(address operator, bool approved) external {
        require(
            msg.sender != operator,
            "Operator can't be the function caller"
        );
        _operatorApproval[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /// @dev see {_operatorApproval}
    function isApprovedForAll(address owner, address operator)
        external
        view
        returns (bool)
    {
        return _operatorApproval[owner][operator];
    }

    /**
     * @dev Mints new token
     * @param to The address of the minted token
     * @param tokenId The id of the minted token
     */
    function _mint(address to, uint256 tokenId) internal validAddress(to) {
        require(_tokenOwner[tokenId] == address(0), "Token already minted");

        _addressBalance[to] += 1;
        _tokenOwner[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    /// @dev see {_tokenURI}
    function _setTokenURI(uint256 tokenId, string memory newTokenURI)
        internal
        validToken(tokenId)
    {
        _tokenURI[tokenId] = newTokenURI;
    }
}
