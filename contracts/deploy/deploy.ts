import { ethers } from "hardhat";
import {  ERC725 } from "@erc725/erc725.js";
import { Canvas, Canvas__factory } from "../typechain-types";
import canvasMetadata from "../metadata/canvasMetadata.json"

// const provider = new ethers.JsonRpcProvider(
//   "https://42.rpc.thirdweb.com",
//   {
//     chainId: 42,
//     name: "luksoMainnet",
//   }
// );

const provider = new ethers.JsonRpcProvider(
  "https://rpc.testnet.lukso.network",
  {
    chainId: 4201,
    name: "luksoTestnet",
  }
);

// Define the main function
async function main() {
  try {
    // Access the private key from the Hardhat variables
    const deployerPrivateKey = "0x43361a4e65f999bb2fe735d873f393763a931121a4f4ee4d775e8a3cd228a34a";

    // Create a wallet instance using the private key and connect it to the provider
    const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);

    const schema = [
      {
        name: "LSP4Metadata",
        key: "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e",
        keyType: "Singleton",
        valueType: "bytes",
        valueContent: "VerifiableURI",
      },
    ];
    const erc725 = new ERC725(schema) as any;
    const encodedData = erc725.encodeData([
      {
        keyName: "LSP4Metadata",
        value: {
          json: JSON.stringify(canvasMetadata),
          url: "ipfs://bafkreidz5jmdtmjno3myrgm6wmd7qt47w2iegzej3jghkz5xzphe7sbxuy",
        },
      },
    ]);

    console.log(encodedData.values[0])

    const nftCollection: Canvas = await new Canvas__factory(
      deployerWallet
    ).deploy("Canvas", "CAV", deployerWallet.address, 1, 0, encodedData.values[0]);

    await nftCollection.waitForDeployment();

    console.log(nftCollection);
  } catch (error) {
    console.error("Error deploying contract:", error);
  }
}

// Call the main function
main().catch((error) => {
  console.error("Error in the deployment process:", error);
  process.exitCode = 1;
});
