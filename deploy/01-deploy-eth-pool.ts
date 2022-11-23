import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import verify from "../utils/verify";

const fn: DeployFunction = async ({
  getChainId,
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let args: any[] = [];
  const nftMarketplace = await deploy("ETHPool", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations,
  });

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying deployed contract");
    await verify(nftMarketplace.address, args);
  }

  log("----------");
};

fn.tags = ["all", "ETHPool"];

export default fn;
