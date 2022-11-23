import { ethers } from "hardhat";
import { ETHPool } from "../typechain-types";

const checkTotalDeposits = async () => {
  const ethPool: ETHPool = await ethers.getContract("ETHPool");
  const totalDeposits = await ethPool.totalDeposits();
  console.log(`total deposits: ${ethers.utils.formatEther(totalDeposits)} ETH`);
};

checkTotalDeposits().catch((err) => {
  console.error(err);
  process.exit(1);
});
