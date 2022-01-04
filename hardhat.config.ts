import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "solidity-coverage";

dotenv.config();

const INFURA_KEY = process.env.INFURA_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
const ETHERSCAN_TOKEN = process.env.ETHERSCAN_TOKEN;

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545"
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + INFURA_KEY,
      accounts: PRIVATE_KEY
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_TOKEN
  }
};

export default config;
