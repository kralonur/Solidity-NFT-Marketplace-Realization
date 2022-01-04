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

async function getMarketplace(hre: HardhatRuntimeEnvironment, contractAddress: string) {
    const MyContract: NftMarketplace__factory = <NftMarketplace__factory>await hre.ethers.getContractFactory("NftMarketplace__factory");
    const contract: NftMarketplace = MyContract.attach(contractAddress);
    return contract;
}