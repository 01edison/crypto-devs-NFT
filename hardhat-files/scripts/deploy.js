const { ethers } = require("hardhat");
require("dotenv").config();
async function main() {
  const cryptoDevsContract = await  ethers.getContractFactory("CryptoDevs");

  const deployedContract = await cryptoDevsContract.deploy(process.env.BASE_URL, process.env.WHITELIST_CONTRACT_ADDRESS);

  await deployedContract.deployed();

  console.log("Crypto devs NFT contract deployed at: ", deployedContract.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
