import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721WithAccessControl, ERC721WithAccessControl__factory, NftMarketplace, NftMarketplace__factory, ERC1155WithAccessControl, ERC1155WithAccessControl__factory, ERC1155Marketplace, ERC1155Marketplace__factory } from "../typechain-types";

describe("NftMarketplace", function () {
  let accounts: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: NftMarketplace;
  let tokenContract: ERC721WithAccessControl;
  const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");

  before(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
  });

  beforeEach(async function () {
    tokenContract = await getTokenContract(owner);
    const tokenFactory = new NftMarketplace__factory(owner);
    contract = await tokenFactory.deploy(tokenContract.address);
    await contract.deployed();

    await tokenContract.grantRole(MINTER_ROLE, contract.address);
  });

  it("Should create item", async function () {
    const tokenURI = "https://example.com/item-id-0.json";
    const itemId = 0;

    // Revoke minter role for test
    await tokenContract.revokeRole(MINTER_ROLE, contract.address);

    await expect(contract.createItem(tokenURI))
      .to.be.revertedWith("You must have minter role to mint");

    await tokenContract.grantRole(MINTER_ROLE, contract.address);

    await contract.createItem(tokenURI);

    expect(await tokenContract.tokenURI(itemId))
      .to.equal(tokenURI);

    expect(await tokenContract.ownerOf(itemId))
      .to.equal(owner.address);
  });

  it("Should list item", async function () {
    const itemId = 0;
    const tradeId = 0;
    const price = ethers.utils.parseEther('0.01');
    const state = 0; // TradeState.ON_SALE;
    const tokenURI = "https://example.com/item-id-0.json";

    await expect(contract.listItem(itemId, price))
      .to.be.revertedWith("Token does not exist");

    await contract.createItem(tokenURI);

    await expect(contract.listItem(itemId, price))
      .to.be.revertedWith("Caller is not allowed to transfer this token");

    await tokenContract.approve(contract.address, itemId);

    // before listing
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(owner.address);

    await contract.listItem(itemId, price);

    // after listing
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(contract.address);

    const trade = await contract.getTrade(tradeId);

    expect(trade.createdAt.toNumber())
      .to.be.greaterThan(0);
    expect(trade.stateChangedAt.toNumber())
      .to.be.greaterThan(0);
    expect(trade.item)
      .to.equal(itemId);
    expect(trade.price)
      .to.equal(price);
    expect(trade.seller)
      .to.equal(owner.address);
    expect(trade.state)
      .to.equal(state);
  });

  it("Should buy item", async function () {
    const itemId = 0;
    const tradeId = 0;
    const price = ethers.utils.parseEther('0.01');
    let state = 0; // TradeState.ON_SALE;
    const tokenURI = "https://example.com/item-id-0.json";

    await contract.createItem(tokenURI);
    await tokenContract.approve(contract.address, itemId);
    await contract.listItem(itemId, price);
    const trade = await contract.getTrade(tradeId);

    await expect(contract.connect(accounts[1]).buyItem(2, {
      value: price
    }))
      .to.be.revertedWith("Trade does not exist");

    await expect(contract.connect(accounts[1]).buyItem(tradeId, {
      value: price.add(100)
    }))
      .to.be.revertedWith("The eth amount is not correct to buy");

    // Trade
    expect(await contract.connect(accounts[1]).buyItem(tradeId, {
      value: price
    }))
      .to.changeEtherBalance(accounts[1], price.mul(-1))
      .to.changeEtherBalance(owner, price);

    // After trade
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(accounts[1].address);
    state = 1; // TradeState.SOLD;
    const afterTrade = await contract.getTrade(tradeId);

    expect(afterTrade.createdAt.toNumber())
      .to.equal(trade.createdAt.toNumber());
    expect(afterTrade.stateChangedAt.toNumber())
      .to.greaterThan(trade.stateChangedAt.toNumber());
    expect(afterTrade.state)
      .to.equal(state);

    // Try to buy same item again
    await expect(contract.connect(accounts[1]).buyItem(tradeId, {
      value: price
    }))
      .to.be.revertedWith("Trade is not on sale");
  });

  it("Should cancel trade", async function () {
    const itemId = 0;
    const tradeId = 0;
    const price = ethers.utils.parseEther('0.01');
    let state = 0; // TradeState.ON_SALE;
    const tokenURI = "https://example.com/item-id-0.json";

    await contract.createItem(tokenURI);
    await tokenContract.approve(contract.address, itemId);
    await contract.listItem(itemId, price);
    const trade = await contract.getTrade(tradeId);

    await expect(contract.cancel(2))
      .to.be.revertedWith("Trade does not exist");

    await expect(contract.connect(accounts[1]).cancel(tradeId))
      .to.be.revertedWith("Trade only can be canceled by seller");

    // Cancel
    await contract.cancel(tradeId);

    // After cancel
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(owner.address);
    state = 2; // TradeState.CANCELED;
    const afterCancel = await contract.getTrade(tradeId);

    expect(afterCancel.createdAt.toNumber())
      .to.equal(trade.createdAt.toNumber());
    expect(afterCancel.stateChangedAt.toNumber())
      .to.greaterThan(trade.stateChangedAt.toNumber());
    expect(afterCancel.state)
      .to.equal(state);

    // Try to cancel same trade again
    await expect(contract.cancel(tradeId))
      .to.be.revertedWith("Trade is not on sale");
  });

  it("Should list item on auction", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const state = 1; // AuctionState.ON_AUCTION;
    const tokenURI = "https://example.com/item-id-0.json";

    await expect(contract.listItemOnAuction(itemId, bidStartPrice))
      .to.be.revertedWith("Token does not exist");

    await contract.createItem(tokenURI);

    await expect(contract.listItemOnAuction(itemId, bidStartPrice))
      .to.be.revertedWith("Caller is not allowed to transfer this token");

    await tokenContract.approve(contract.address, itemId);

    // before listing
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(owner.address);

    await contract.listItemOnAuction(itemId, bidStartPrice);

    // after listing
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(contract.address);

    const auction = await contract.getAuction(auctionId);

    expect(auction.createdAt.toNumber())
      .to.be.greaterThan(0);
    expect(auction.stateChangedAt.toNumber())
      .to.be.greaterThan(0);
    expect(auction.item)
      .to.equal(itemId);
    expect(auction.bidCount)
      .to.equal(0);
    expect(auction.bidStartPrice)
      .to.equal(bidStartPrice);
    expect(auction.highestBid)
      .to.equal(0);
    expect(auction.highestBidder)
      .to.equal(ethers.constants.AddressZero);
    expect(auction.seller)
      .to.equal(owner.address);
    expect(auction.state)
      .to.equal(state);
  });

  it("Should make bid", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);
    const secondBidPrice = firstBidPrice.add(100);
    const tokenURI = "https://example.com/item-id-0.json";

    await contract.createItem(tokenURI);
    await tokenContract.approve(contract.address, itemId);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await expect(contract.connect(accounts[1]).makeBid(2, {
      value: bidStartPrice
    }))
      .to.be.revertedWith("Auction does not exist");

    await expect(contract.connect(accounts[1]).makeBid(auctionId, {
      value: bidStartPrice.sub(100)
    }))
      .to.be.revertedWith("The eth amount is below min bid price");

    // First bid
    expect(await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    }))
      .to.changeEtherBalance(accounts[1], firstBidPrice.mul(-1))
      .to.changeEtherBalance(contract, firstBidPrice);
    const auctionFirstBid = await contract.getAuction(auctionId);

    expect(auctionFirstBid.bidCount.toNumber())
      .to.equal(1);
    expect(auctionFirstBid.highestBid)
      .to.equal(firstBidPrice);
    expect(auctionFirstBid.highestBidder)
      .to.equal(accounts[1].address);

    // Second bid
    await expect(contract.connect(accounts[2]).makeBid(auctionId, {
      value: firstBidPrice.sub(50)
    }))
      .to.be.revertedWith("The eth amount is below highest bid price");

    expect(await contract.connect(accounts[2]).makeBid(auctionId, {
      value: secondBidPrice
    }))
      .to.changeEtherBalance(accounts[2], secondBidPrice.mul(-1))
      .to.changeEtherBalance(accounts[1], firstBidPrice)
      .to.changeEtherBalance(contract, 100);
    const auctionSecondBid = await contract.getAuction(auctionId);

    expect(auctionSecondBid.bidCount.toNumber())
      .to.equal(2);
    expect(auctionSecondBid.highestBid)
      .to.equal(secondBidPrice);
    expect(auctionSecondBid.highestBidder)
      .to.equal(accounts[2].address);

    // After 3 days passed
    await simulateTimePassed();
    await expect(contract.connect(accounts[3]).makeBid(auctionId, {
      value: secondBidPrice.add(100)
    }))
      .to.be.revertedWith("Too late to make bid");

    // After auction finished
    await contract.finishAuction(auctionId);
    await expect(contract.connect(accounts[3]).makeBid(auctionId, {
      value: secondBidPrice.add(100)
    }))
      .to.be.revertedWith("Auction is not active");
  });

  it("Should finish auction (2 bidders)", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);
    const secondBidPrice = firstBidPrice.add(100);
    const tokenURI = "https://example.com/item-id-0.json";

    await contract.createItem(tokenURI);
    await tokenContract.approve(contract.address, itemId);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    });
    await contract.connect(accounts[2]).makeBid(auctionId, {
      value: secondBidPrice
    });

    await expect(contract.finishAuction(auctionId))
      .to.be.revertedWith("Auction is too early to finish");

    // After 3 days passed
    await simulateTimePassed();
    await expect(contract.connect(accounts[2]).finishAuction(itemId))
      .to.be.revertedWith("Auction only can be finished by seller");

    // After auction finished
    expect(await contract.finishAuction(auctionId))
      .to.changeEtherBalance(contract, secondBidPrice.mul(-1))
      .to.changeEtherBalance(owner, secondBidPrice);
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(accounts[2].address);
    const auction = await contract.getAuction(auctionId);

    expect(auction.state)
      .to.equal(2); //AuctionState.SOLD

    await expect(contract.finishAuction(auctionId))
      .to.be.revertedWith("Auction is not active");
  });

  it("Should finish auction (1 bidder)", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);
    const tokenURI = "https://example.com/item-id-0.json";

    await contract.createItem(tokenURI);
    await tokenContract.approve(contract.address, itemId);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    });
    await simulateTimePassed();

    // After auction finished
    expect(await contract.finishAuction(auctionId))
      .to.changeEtherBalance(contract, firstBidPrice.mul(-1))
      .to.changeEtherBalance(accounts[1], firstBidPrice);
    expect(await tokenContract.ownerOf(itemId))
      .to.equal(owner.address);
    const auction = await contract.getAuction(auctionId);

    expect(auction.state)
      .to.equal(0); //AuctionState.INVALID_AUCTION
  });

  it("Should cancel auction", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);
    const tokenURI = "https://example.com/item-id-0.json";

    await contract.createItem(tokenURI);
    await tokenContract.approve(contract.address, itemId);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    });

    await expect(contract.cancelAuction(auctionId))
      .to.be.revertedWith("Auction is too early to cancel");

    // After 3 days passed
    await simulateTimePassed();
    await expect(contract.connect(accounts[2]).cancelAuction(auctionId))
      .to.be.revertedWith("Auction only can be canceled by seller");

    await contract.cancelAuction(auctionId);
    const auction = await contract.getAuction(auctionId);

    expect(auction.state)
      .to.equal(3); //AuctionState.CANCELED

  });
});

describe("ERC1155Marketplace", function () {
  let accounts: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: ERC1155Marketplace;
  let tokenContract: ERC1155WithAccessControl;
  const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");

  before(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
  });

  beforeEach(async function () {
    tokenContract = await getERC1155TokenContract(owner);
    const tokenFactory = new ERC1155Marketplace__factory(owner);
    contract = await tokenFactory.deploy(tokenContract.address);
    await contract.deployed();

    await tokenContract.grantRole(MINTER_ROLE, contract.address);
  });

  it("Should create item", async function () {
    const itemId = 0;

    // Revoke minter role for test
    await tokenContract.revokeRole(MINTER_ROLE, contract.address);

    await expect(contract.createItem())
      .to.be.revertedWith("You must have minter role to mint");

    await tokenContract.grantRole(MINTER_ROLE, contract.address);

    await contract.createItem();

    expect(await tokenContract.balanceOf(owner.address, itemId))
      .to.equal(1);
  });

  it("Should list item", async function () {
    const itemId = 0;
    const tradeId = 0;
    const price = ethers.utils.parseEther('0.01');
    const state = 0; // TradeState.ON_SALE;

    await contract.createItem();

    await expect(contract.listItem(itemId, price))
      .to.be.revertedWith("ERC1155: caller is not owner nor approved");

    await tokenContract.setApprovalForAll(contract.address, true);

    // before listing
    expect(await tokenContract.balanceOf(owner.address, itemId))
      .to.equal(1);

    await contract.listItem(itemId, price);

    // after listing
    expect(await tokenContract.balanceOf(contract.address, itemId))
      .to.equal(1);

    const trade = await contract.getTrade(tradeId);

    expect(trade.createdAt.toNumber())
      .to.be.greaterThan(0);
    expect(trade.stateChangedAt.toNumber())
      .to.be.greaterThan(0);
    expect(trade.item)
      .to.equal(itemId);
    expect(trade.price)
      .to.equal(price);
    expect(trade.seller)
      .to.equal(owner.address);
    expect(trade.state)
      .to.equal(state);
  });

  it("Should buy item", async function () {
    const itemId = 0;
    const tradeId = 0;
    const price = ethers.utils.parseEther('0.01');
    let state = 0; // TradeState.ON_SALE;

    await contract.createItem();
    await tokenContract.setApprovalForAll(contract.address, true);
    await contract.listItem(itemId, price);
    const trade = await contract.getTrade(tradeId);

    await expect(contract.connect(accounts[1]).buyItem(2, {
      value: price
    }))
      .to.be.revertedWith("Trade does not exist");

    await expect(contract.connect(accounts[1]).buyItem(tradeId, {
      value: price.add(100)
    }))
      .to.be.revertedWith("The eth amount is not correct to buy");

    // Trade
    expect(await contract.connect(accounts[1]).buyItem(tradeId, {
      value: price
    }))
      .to.changeEtherBalance(accounts[1], price.mul(-1))
      .to.changeEtherBalance(owner, price);

    // After trade
    expect(await tokenContract.balanceOf(accounts[1].address, itemId))
      .to.equal(1);
    state = 1; // TradeState.SOLD;
    const afterTrade = await contract.getTrade(tradeId);

    expect(afterTrade.createdAt.toNumber())
      .to.equal(trade.createdAt.toNumber());
    expect(afterTrade.stateChangedAt.toNumber())
      .to.greaterThan(trade.stateChangedAt.toNumber());
    expect(afterTrade.state)
      .to.equal(state);

    // Try to buy same item again
    await expect(contract.connect(accounts[1]).buyItem(tradeId, {
      value: price
    }))
      .to.be.revertedWith("Trade is not on sale");
  });

  it("Should cancel trade", async function () {
    const itemId = 0;
    const tradeId = 0;
    const price = ethers.utils.parseEther('0.01');
    let state = 0; // TradeState.ON_SALE;

    await contract.createItem();
    await tokenContract.setApprovalForAll(contract.address, true);
    await contract.listItem(itemId, price);
    const trade = await contract.getTrade(tradeId);

    await expect(contract.cancel(2))
      .to.be.revertedWith("Trade does not exist");

    await expect(contract.connect(accounts[1]).cancel(tradeId))
      .to.be.revertedWith("Trade only can be canceled by seller");

    // Cancel
    await contract.cancel(tradeId);

    // After cancel
    expect(await tokenContract.balanceOf(owner.address, itemId))
      .to.equal(1);
    state = 2; // TradeState.CANCELED;
    const afterCancel = await contract.getTrade(tradeId);

    expect(afterCancel.createdAt.toNumber())
      .to.equal(trade.createdAt.toNumber());
    expect(afterCancel.stateChangedAt.toNumber())
      .to.greaterThan(trade.stateChangedAt.toNumber());
    expect(afterCancel.state)
      .to.equal(state);

    // Try to cancel same trade again
    await expect(contract.cancel(tradeId))
      .to.be.revertedWith("Trade is not on sale");
  });

  it("Should list item on auction", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const state = 1; // AuctionState.ON_AUCTION;

    await contract.createItem();

    await expect(contract.listItemOnAuction(itemId, bidStartPrice))
      .to.be.revertedWith("ERC1155: caller is not owner nor approved");

    await tokenContract.setApprovalForAll(contract.address, true);

    // before listing
    expect(await tokenContract.balanceOf(owner.address, itemId))
      .to.equal(1);

    await contract.listItemOnAuction(itemId, bidStartPrice);

    // after listing
    expect(await tokenContract.balanceOf(contract.address, itemId))
      .to.equal(1);

    const auction = await contract.getAuction(auctionId);

    expect(auction.createdAt.toNumber())
      .to.be.greaterThan(0);
    expect(auction.stateChangedAt.toNumber())
      .to.be.greaterThan(0);
    expect(auction.item)
      .to.equal(itemId);
    expect(auction.bidCount)
      .to.equal(0);
    expect(auction.bidStartPrice)
      .to.equal(bidStartPrice);
    expect(auction.highestBid)
      .to.equal(0);
    expect(auction.highestBidder)
      .to.equal(ethers.constants.AddressZero);
    expect(auction.seller)
      .to.equal(owner.address);
    expect(auction.state)
      .to.equal(state);
  });

  it("Should make bid", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);
    const secondBidPrice = firstBidPrice.add(100);

    await contract.createItem();
    await tokenContract.setApprovalForAll(contract.address, true);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await expect(contract.connect(accounts[1]).makeBid(2, {
      value: bidStartPrice
    }))
      .to.be.revertedWith("Auction does not exist");

    await expect(contract.connect(accounts[1]).makeBid(auctionId, {
      value: bidStartPrice.sub(100)
    }))
      .to.be.revertedWith("The eth amount is below min bid price");

    // First bid
    expect(await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    }))
      .to.changeEtherBalance(accounts[1], firstBidPrice.mul(-1))
      .to.changeEtherBalance(contract, firstBidPrice);
    const auctionFirstBid = await contract.getAuction(auctionId);

    expect(auctionFirstBid.bidCount.toNumber())
      .to.equal(1);
    expect(auctionFirstBid.highestBid)
      .to.equal(firstBidPrice);
    expect(auctionFirstBid.highestBidder)
      .to.equal(accounts[1].address);

    // Second bid
    await expect(contract.connect(accounts[2]).makeBid(auctionId, {
      value: firstBidPrice.sub(50)
    }))
      .to.be.revertedWith("The eth amount is below highest bid price");

    expect(await contract.connect(accounts[2]).makeBid(auctionId, {
      value: secondBidPrice
    }))
      .to.changeEtherBalance(accounts[2], secondBidPrice.mul(-1))
      .to.changeEtherBalance(accounts[1], firstBidPrice)
      .to.changeEtherBalance(contract, 100);
    const auctionSecondBid = await contract.getAuction(auctionId);

    expect(auctionSecondBid.bidCount.toNumber())
      .to.equal(2);
    expect(auctionSecondBid.highestBid)
      .to.equal(secondBidPrice);
    expect(auctionSecondBid.highestBidder)
      .to.equal(accounts[2].address);

    // After 3 days passed
    await simulateTimePassed();
    await expect(contract.connect(accounts[3]).makeBid(auctionId, {
      value: secondBidPrice.add(100)
    }))
      .to.be.revertedWith("Too late to make bid");

    // After auction finished
    await contract.finishAuction(auctionId);
    await expect(contract.connect(accounts[3]).makeBid(auctionId, {
      value: secondBidPrice.add(100)
    }))
      .to.be.revertedWith("Auction is not active");
  });

  it("Should finish auction (2 bidders)", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);
    const secondBidPrice = firstBidPrice.add(100);

    await contract.createItem();
    await tokenContract.setApprovalForAll(contract.address, true);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    });
    await contract.connect(accounts[2]).makeBid(auctionId, {
      value: secondBidPrice
    });

    await expect(contract.finishAuction(auctionId))
      .to.be.revertedWith("Auction is too early to finish");

    // After 3 days passed
    await simulateTimePassed();
    await expect(contract.connect(accounts[2]).finishAuction(itemId))
      .to.be.revertedWith("Auction only can be finished by seller");

    // After auction finished
    expect(await contract.finishAuction(auctionId))
      .to.changeEtherBalance(contract, secondBidPrice.mul(-1))
      .to.changeEtherBalance(owner, secondBidPrice);
    expect(await tokenContract.balanceOf(accounts[2].address, itemId))
      .to.equal(1);
    const auction = await contract.getAuction(auctionId);

    expect(auction.state)
      .to.equal(2); //AuctionState.SOLD

    await expect(contract.finishAuction(auctionId))
      .to.be.revertedWith("Auction is not active");
  });

  it("Should finish auction (1 bidder)", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);

    await contract.createItem();
    await tokenContract.setApprovalForAll(contract.address, true);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    });
    await simulateTimePassed();

    // After auction finished
    expect(await contract.finishAuction(auctionId))
      .to.changeEtherBalance(contract, firstBidPrice.mul(-1))
      .to.changeEtherBalance(accounts[1], firstBidPrice);
    expect(await tokenContract.balanceOf(owner.address, itemId))
      .to.equal(1);
    const auction = await contract.getAuction(auctionId);

    expect(auction.state)
      .to.equal(0); //AuctionState.INVALID_AUCTION
  });

  it("Should cancel auction", async function () {
    const itemId = 0;
    const auctionId = 0;
    const bidStartPrice = ethers.utils.parseEther('0.1');
    const firstBidPrice = bidStartPrice.add(100);

    await contract.createItem();
    await tokenContract.setApprovalForAll(contract.address, true);
    await contract.listItemOnAuction(itemId, bidStartPrice);

    await contract.connect(accounts[1]).makeBid(auctionId, {
      value: firstBidPrice
    });

    await expect(contract.cancelAuction(auctionId))
      .to.be.revertedWith("Auction is too early to cancel");

    // After 3 days passed
    await simulateTimePassed();
    await expect(contract.connect(accounts[2]).cancelAuction(auctionId))
      .to.be.revertedWith("Auction only can be canceled by seller");

    await contract.cancelAuction(auctionId);
    const auction = await contract.getAuction(auctionId);

    expect(auction.state)
      .to.equal(3); //AuctionState.CANCELED

  });
});

async function getTokenContract(owner: SignerWithAddress) {
  const tokenFactory = new ERC721WithAccessControl__factory(owner);
  const tokenContract = await tokenFactory.deploy("ENEFTI", "NFT");
  await tokenContract.deployed();

  return tokenContract;
}

async function getERC1155TokenContract(owner: SignerWithAddress) {
  const tokenFactory = new ERC1155WithAccessControl__factory(owner);
  const tokenContract = await tokenFactory.deploy("https://game.example/api/item/{id}.json");
  await tokenContract.deployed();

  return tokenContract;
}

async function simulateTimePassed() {
  const duration = 3 * (60 * 60 * 24); // 3days is standard
  await ethers.provider.send('evm_increaseTime', [duration]);
}