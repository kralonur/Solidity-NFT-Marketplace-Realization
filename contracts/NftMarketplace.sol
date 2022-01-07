//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721WithAccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title A contract to trade and mint ERC721 Token
 * @author Me
 */
contract NftMarketplace is IERC721Receiver, ReentrancyGuard {
    /// Enum for holding states of the trade
    enum TradeState {
        ON_SALE,
        SOLD,
        CANCELED
    }

    /**
     * @dev This struct holds information about the trade
     * @param createdAt Creation time of the trade
     * @param stateChangedAt Latest state change time of the trade
     * @param item The id of sold ERC721 item
     * @param price The price of the item
     * @param seller The creator of the trade
     * @param state see {TradeState}
     */
    struct Trade {
        uint256 createdAt;
        uint256 stateChangedAt;
        uint256 item;
        uint256 price;
        address seller;
        TradeState state;
    }

    /// ERC721 Token with access control
    ERC721WithAccessControl private _nftContract;

    /// Current trade id
    uint256 private _tradeId;

    /// A mapping for storing trades
    mapping(uint256 => Trade) private _trades;

    constructor(address _nftContractAddress) {
        _nftContract = ERC721WithAccessControl(_nftContractAddress);
    }

    /**
     * @dev Emitted when trade state is change
     * @param tradeId The id of the trade
     * @param state The state of the trade
     */
    event TradeStateChanged(uint256 indexed tradeId, TradeState state);

    /**
     * @dev Modifier for checking if the trade exists
     * @param tradeId The id of the trade
     */
    modifier validTrade(uint256 tradeId) {
        require(_trades[tradeId].createdAt > 0, "Trade does not exist");
        _;
    }

    /**
     * @dev Creates new item using the ERC721 contract
     * @param tokenURI The URI of the created contract
     */
    function createItem(string memory tokenURI) external {
        _nftContract.createItem(msg.sender, tokenURI);
    }

    /**
     * @dev Lists the item on the market for buyers to buy
     * @param item The id of the item
     * @param price Price of the listed item
     */
    function listItem(uint256 item, uint256 price) external {
        _nftContract.safeTransferFrom(msg.sender, address(this), item);

        Trade storage trade = _trades[_tradeId];

        trade.createdAt = block.timestamp;
        trade.item = item;
        trade.price = price;
        trade.seller = msg.sender;

        _updateTradeState(_tradeId++, TradeState.ON_SALE);
    }

    /**
     * @dev Buys the listed item from market
     * @param tradeId The id of the trade
     */
    function buyItem(uint256 tradeId)
        external
        payable
        validTrade(tradeId)
        nonReentrant
    {
        Trade storage trade = _trades[tradeId];
        require(trade.state == TradeState.ON_SALE, "Trade is not on sale");
        require(
            msg.value == trade.price,
            "The eth amount is not correct to buy"
        );

        _nftContract.safeTransferFrom(address(this), msg.sender, trade.item);
        payable(trade.seller).transfer(msg.value);

        _updateTradeState(tradeId, TradeState.SOLD);
    }

    /**
     * @dev Delists the item from the market
     * @param tradeId The id of the trade
     */
    function cancel(uint256 tradeId) external validTrade(tradeId) nonReentrant {
        Trade storage trade = _trades[tradeId];
        require(trade.state == TradeState.ON_SALE, "Trade is not on sale");
        require(
            msg.sender == trade.seller,
            "Trade only can be canceled by seller"
        );

        _nftContract.safeTransferFrom(address(this), trade.seller, trade.item);
        _updateTradeState(tradeId, TradeState.CANCELED);
    }

    /**
     * @dev Updates the state of the trade
     * @param tradeId The id of the trade
     * @param state New state of the trade
     */
    function _updateTradeState(uint256 tradeId, TradeState state) private {
        Trade storage trade = _trades[tradeId];
        trade.state = state;
        trade.stateChangedAt = block.timestamp;
        emit TradeStateChanged(tradeId, state);
    }

    /// @dev see {Trade}
    function getTrade(uint256 tradeId)
        external
        view
        validTrade(tradeId)
        returns (
            uint256 createdAt,
            uint256 stateChangedAt,
            uint256 item,
            uint256 price,
            address seller,
            TradeState state
        )
    {
        Trade storage trade = _trades[tradeId];

        return (
            trade.createdAt,
            trade.stateChangedAt,
            trade.item,
            trade.price,
            trade.seller,
            trade.state
        );
    }

    /// @dev see {IERC721Receiver-onERC721Received}
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
