import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NftMarketplace__factory, ERC721WithAccessControl__factory } from "../typechain-types";

async function main() {
  const [owner] = await ethers.getSigners();
  const tokenContract = await getTokenContract(owner);
  const tokenFactory = new NftMarketplace__factory(owner);
  const contract = await tokenFactory.deploy(tokenContract.address);
  await contract.deployed();

  console.log("NftWithAccess deployed to:", tokenContract.address);
  console.log("NftMarketplace deployed to:", contract.address);
}

async function getTokenContract(owner: SignerWithAddress) {
  const tokenFactory = new ERC721WithAccessControl__factory(owner);
  const tokenContract = await tokenFactory.deploy("ENEFTI", "NFT");
  await tokenContract.deployed();

  return tokenContract;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
