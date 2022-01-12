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

    /// Enum for holding states of the auction
    enum AuctionState {
        INVALID_AUCTION,
        ON_AUCTION,
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

    /**
     * @dev This struct holds information about the auction
     * @param createdAt Creation time of the auction
     * @param stateChangedAt Latest state change time of the auction
     * @param item The id of sold ERC721 item
     * @param bidCount The amount of bids made to auction
     * @param bidStartPrice The min amount to bid for the auction
     * @param highestBid The highest bid made for auction
     * @param highestBidder The address of highest bidder
     * @param seller The creator of the auction
     * @param state see {AuctionState}
     */
    struct Auction {
        uint256 createdAt;
        uint256 stateChangedAt;
        uint256 item;
        uint256 bidCount;
        uint256 bidStartPrice;
        uint256 highestBid;
        address highestBidder;
        address seller;
        AuctionState state;
    }

    /// ERC721 Token with access control
    ERC721WithAccessControl private _nftContract;

    /// Current trade id
    uint256 private _tradeId;

    /// Current auction id
    uint256 private _auctionId;

    /// Constant auction length
    uint256 public constant auctionLength = 3 days;

    /// A mapping for storing trades
    mapping(uint256 => Trade) private _trades;

    /// A mapping for storing auctions
    mapping(uint256 => Auction) private _auctions;

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
     * @dev Emitted when auction state is change
     * @param auctionId The id of the auction
     * @param state The state of the auction
     */
    event AuctionStateChanged(uint256 indexed auctionId, AuctionState state);

    /**
     * @dev Emitted when a bid for the auction
     * @param auctionId The id of the auction
     * @param bidderAddress The address of the bidder
     * @param bidAmount The bid amount
     */
    event AuctionBidMade(
        uint256 indexed auctionId,
        address indexed bidderAddress,
        uint256 bidAmount
    );

    /**
     * @dev Modifier for checking if the trade exists
     * @param tradeId The id of the trade
     */
    modifier validTrade(uint256 tradeId) {
        require(_trades[tradeId].createdAt > 0, "Trade does not exist");
        _;
    }

    /**
     * @dev Modifier for checking if the auction exists
     * @param auctionId The id of the auction
     */
    modifier validAuction(uint256 auctionId) {
        require(_auctions[auctionId].createdAt > 0, "Auction does not exist");
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
     * @dev Lists the item on the auction for bidders to bid
     * @param item The id of the item
     * @param startPrice Starting price of the auction
     */
    function listItemOnAuction(uint256 item, uint256 startPrice) external {
        _nftContract.safeTransferFrom(msg.sender, address(this), item);

        Auction storage auction = _auctions[_auctionId];

        auction.createdAt = block.timestamp;
        auction.item = item;
        auction.seller = msg.sender;
        auction.bidStartPrice = startPrice;

        _updateAuctionState(_auctionId++, AuctionState.ON_AUCTION);
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
     * @dev Makes bid on auction
     * @param auctionId The id of the auction
     */
    function makeBid(uint256 auctionId)
        external
        payable
        validAuction(auctionId)
    {
        Auction storage auction = _auctions[auctionId];
        require(
            auction.state == AuctionState.ON_AUCTION,
            "Auction is not active"
        );
        require(
            auction.createdAt + auctionLength > block.timestamp,
            "Too late to make bid"
        );
        require(
            msg.value >= auction.bidStartPrice,
            "The eth amount is below min bid price"
        );
        require(
            msg.value > auction.highestBid,
            "The eth amount is below highest bid price"
        );

        // returns old highest bidder it's money
        if (auction.highestBidder != address(0))
            payable(auction.highestBidder).transfer(auction.highestBid);

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        auction.bidCount++;

        emit AuctionBidMade(auctionId, msg.sender, msg.value);
    }

    /**
     * @dev Finishes the auction
     * @param auctionId The id of the auction
     */
    function finishAuction(uint256 auctionId)
        external
        validAuction(auctionId)
        nonReentrant
    {
        Auction storage auction = _auctions[auctionId];
        require(
            auction.state == AuctionState.ON_AUCTION,
            "Auction is not active"
        );
        require(
            msg.sender == auction.seller,
            "Auction only can be finished by seller"
        );
        require(
            auction.createdAt + auctionLength < block.timestamp,
            "Auction is too early to finish"
        );

        // Auction is invalid
        if (auction.bidCount < 2) {
            _nftContract.safeTransferFrom(
                address(this),
                auction.seller,
                auction.item
            );
            _updateAuctionState(auctionId, AuctionState.INVALID_AUCTION);
            if (auction.highestBidder != address(0))
                payable(auction.highestBidder).transfer(auction.highestBid);
        } else {
            _nftContract.safeTransferFrom(
                address(this),
                auction.highestBidder,
                auction.item
            );
            _updateAuctionState(auctionId, AuctionState.SOLD);
            payable(auction.seller).transfer(auction.highestBid);
        }
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
     * @dev Cancels the auction
     * @param auctionId The id of the auction
     */
    function cancelAuction(uint256 auctionId)
        external
        validAuction(auctionId)
        nonReentrant
    {
        Auction storage auction = _auctions[auctionId];
        require(
            msg.sender == auction.seller,
            "Auction only can be canceled by seller"
        );
        require(
            auction.createdAt + auctionLength < block.timestamp,
            "Auction is too early to cancel"
        );

        _nftContract.safeTransferFrom(
            address(this),
            auction.seller,
            auction.item
        );
        if (auction.highestBidder != address(0))
            payable(auction.highestBidder).transfer(auction.highestBid);
        _updateAuctionState(auctionId, AuctionState.CANCELED);
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

    function _updateAuctionState(uint256 auctionId, AuctionState state)
        private
    {
        Auction storage auction = _auctions[auctionId];
        auction.state = state;
        auction.stateChangedAt = block.timestamp;
        emit AuctionStateChanged(auctionId, state); //TODO
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

    /// @dev see {Auction}
    function getAuction(uint256 auctionId)
        external
        view
        validAuction(auctionId)
        returns (
            uint256 createdAt,
            uint256 stateChangedAt,
            uint256 item,
            uint256 bidCount,
            uint256 bidStartPrice,
            uint256 highestBid,
            address highestBidder,
            address seller,
            AuctionState state
        )
    {
        Auction storage auction = _auctions[auctionId];

        return (
            auction.createdAt,
            auction.stateChangedAt,
            auction.item,
            auction.bidCount,
            auction.bidStartPrice,
            auction.highestBid,
            auction.highestBidder,
            auction.seller,
            auction.state
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
