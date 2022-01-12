import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NftMarketplace, NftMarketplace__factory } from "../typechain-types";

task("create-item", "Creates an ERC721 token")
    .addParam("contract", "The address of the contract")
    .addParam("tokenuri", "The URI for the created token")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);
        await contract.createItem(taskArgs.tokenuri);
        console.log("Created an item");
    });

task("list-item", "Lists item on the market")
    .addParam("contract", "The address of the contract")
    .addParam("item", "The id of the item to list")
    .addParam("price", "The market price of the item")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);
        await contract.listItem(taskArgs.item, taskArgs.price);
        console.log("The item: " + taskArgs.item + " listed for: " + taskArgs.price);
    });

task("buy-item", "Buys the item from the market")
    .addParam("contract", "The address of the contract")
    .addParam("trade", "The id of the trade")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);
        const trade = await contract.getTrade(taskArgs.trade);

        await contract.buyItem(taskArgs.trade, { value: trade.price });
        console.log("The item: " + trade.item + " bought for: " + trade.price);
    });

task("cancel", "Delist the item from the market")
    .addParam("contract", "The address of the contract")
    .addParam("trade", "The id of the trade")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);

        await contract.cancel(taskArgs.trade);
        console.log("The trade: " + taskArgs.trade + " canceled");
    });

task("list-item-auction", "Lists item on the auction")
    .addParam("contract", "The address of the contract")
    .addParam("item", "The id of the item to list")
    .addParam("startprice", "The start price of the auction")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);
        await contract.listItemOnAuction(taskArgs.item, taskArgs.startprice);
        console.log("The item: " + taskArgs.item + " listed with min price: " + taskArgs.startprice);
    });

task("make-bid", "Makes bid on auction")
    .addParam("contract", "The address of the contract")
    .addParam("auction", "The id of the auction")
    .addParam("price", "The bid price")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);

        await contract.makeBid(taskArgs.auction, { value: taskArgs.price });
        console.log("Made bid for: " + taskArgs.price);
    });

task("finish-auction", "Finishes the auction")
    .addParam("contract", "The address of the contract")
    .addParam("auction", "The id of the auction")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);

        await contract.finishAuction(taskArgs.auction);
        console.log("The auction: " + taskArgs.auction + " finished");
    });

task("cancel-auction", "Cancels the auction")
    .addParam("contract", "The address of the contract")
    .addParam("auction", "The id of the auction")
    .setAction(async (taskArgs, hre) => {
        const contract: NftMarketplace = await getMarketplace(hre, taskArgs.contract);

        await contract.cancelAuction(taskArgs.auction);
        console.log("The auction: " + taskArgs.auction + " canceled");
    });

async function getMarketplace(hre: HardhatRuntimeEnvironment, contractAddress: string) {
    const MyContract: NftMarketplace__factory = <NftMarketplace__factory>await hre.ethers.getContractFactory("NftMarketplace__factory");
    const contract: NftMarketplace = MyContract.attach(contractAddress);
    return contract;
}