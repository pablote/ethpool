import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { ETHPool } from "../typechain-types";

describe("ETHPool Unit Tests", function () {
  let ethPool: ETHPool;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    await deployments.fixture(["all"]);
    ethPool = await ethers.getContract("ETHPool");
  });

  describe("constructor", async () => {
    it("correctly deploys an ETHPool", async function () {
      const totalDeposits = await ethPool.totalDeposits();
      const owner = await ethPool.owner();
      expect(totalDeposits.toString()).to.be.equals("0");
      expect(owner).to.be.equals(deployer.address);
    });
  });

  describe("deposit", () => {
    it("correctly deposits the user's funds", async () => {
      const amount = ethers.utils.parseUnits("100", "gwei");
      const ethPoolAsUser1 = ethPool.connect(user1);
      let tx = await ethPoolAsUser1.deposit({ value: amount });
      let receipt = await tx.wait(1);

      const totalDeposits = await ethPool.totalDeposits();
      const user1Deposit = await ethPool.deposits(user1.address);

      expect(totalDeposits.toString()).to.be.equals(amount.toString());
      expect(user1Deposit.toString()).to.be.equals(amount.toString());
    });

    it("correctly deposits the user's funds using the receive function", async () => {
      const amount = ethers.utils.parseUnits("100", "gwei");
      let tx = await user1.sendTransaction({ to: ethPool.address, value: amount });
      let receipt = await tx.wait(1);

      const totalDeposits = await ethPool.totalDeposits();
      const user1Deposit = await ethPool.deposits(user1.address);

      expect(totalDeposits.toString()).to.be.equals(amount.toString());
      expect(user1Deposit.toString()).to.be.equals(amount.toString());
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      const amount = ethers.utils.parseUnits("10", "ether");
      const ethPoolAsUser1 = ethPool.connect(user1);
      let tx = await ethPoolAsUser1.deposit({ value: amount });
      let receipt = await tx.wait(1);
    });

    it("withdraws a user's deposits", async () => {
      let initialBalance = await user1.getBalance();

      const amount = ethers.utils.parseUnits("5", "ether");
      const ethPoolAsUser1 = ethPool.connect(user1);
      let tx = await ethPoolAsUser1.withdraw(amount);
      let receipt = await tx.wait(1);

      let finalBalance = await user1.getBalance();
      expect(finalBalance.gt(initialBalance)).to.be.is.true;
    });

    it("can't withdraw more than the user's balance", async () => {
      const amount = ethers.utils.parseUnits("15", "ether");
      const ethPoolAsUser1 = ethPool.connect(user1);
      expect(ethPoolAsUser1.withdraw(amount)).to.revertedWithCustomError(
        ethPool,
        "ETHPool__NotEnoughFunds"
      );
    });
  });

  describe("depositRewards", () => {
    beforeEach(async () => {
      const amount = ethers.utils.parseUnits("10", "ether");
      const ethPoolAsUser1 = ethPool.connect(user1);
      let tx = await ethPoolAsUser1.deposit({ value: amount });
      let receipt = await tx.wait(1);
    });

    it("can't deposit rewards if it's not the contract owner", async () => {
      const amount = ethers.utils.parseUnits("20", "ether");
      const ethPoolAsUser1 = ethPool.connect(user1);
      expect(ethPoolAsUser1.depositRewards({ value: amount })).to.revertedWithCustomError(
        ethPool,
        "ETHPool__NotTheOwner"
      );
    });

    it("deposits rewards to all current depositors", async () => {
      // deposit as user 2
      let amount = ethers.utils.parseUnits("30", "ether");
      const ethPoolAsUser2 = ethPool.connect(user2);
      let tx = await ethPoolAsUser2.deposit({ value: amount });
      let receipt = await tx.wait(1);

      // save deposits
      let user1Deposit = await ethPool.deposits(user1.address);
      let user2Deposit = await ethPool.deposits(user2.address);
      let totalDeposits = await ethPool.totalDeposits();
      expect(totalDeposits.toString()).to.be.equals(ethers.utils.parseUnits("40", "ether"));

      // deposit rewards
      let rewardAmount = ethers.utils.parseUnits("20", "ether");
      tx = await ethPool.depositRewards({ value: rewardAmount });
      receipt = await tx.wait(1);

      // assert
      let user1FinalDeposit = await ethPool.deposits(user1.address);
      let user2FinalDeposit = await ethPool.deposits(user2.address);
      let finalTotalDeposits = await ethPool.totalDeposits();

      expect(finalTotalDeposits.toString()).to.be.equals(ethers.utils.parseUnits("60", "ether"));
      expect(user1FinalDeposit.gt(user1Deposit)).to.be.true;
      expect(user2FinalDeposit.gt(user2Deposit)).to.be.true;
      expect(user1Deposit.add(rewardAmount.div(4)).eq(user1FinalDeposit)).to.be.true;
      expect(user2Deposit.add(rewardAmount.mul(3).div(4)).eq(user2FinalDeposit)).to.be.true;
    });
  });
});
