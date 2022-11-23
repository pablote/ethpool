type NetworkConfig = {
  name: string;
  blockConfirmations: number;
};
type NetworkConfigs = Record<string, NetworkConfig>;

export const networkConfig: NetworkConfigs = {
  "5": {
    name: "goerli",
    blockConfirmations: 3,
  },
  "31337": {
    name: "hardhat",
    blockConfirmations: 1,
  },
};

export const developmentChains = ["hardhat", "localhost"];
