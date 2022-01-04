import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721WithAccessControl, ERC721WithAccessControl__factory, NftMarketplace, NftMarketplace__factory } from "../typechain-types";

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
});

async function getTokenContract(owner: SignerWithAddress) {
  const tokenFactory = new ERC721WithAccessControl__factory(owner);
  const tokenContract = await tokenFactory.deploy("ENEFTI", "NFT");
  await tokenContract.deployed();

  return tokenContract;
}
