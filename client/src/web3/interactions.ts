/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPublicClient, http, parseUnits } from "viem";
import { lukso, luksoTestnet } from "viem/chains";
import abi from "./abi.json"
import ERC725 from "@erc725/erc725.js";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

export const getNextCanvasId = async (chainId: any) => {
    try {
      const publicClient = createPublicClient({
        chain: chainId === 42 ? lukso : luksoTestnet,
        transport: http(),
      });
  
      const nextCanvasId = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: abi.abi,
        functionName: "nextCanvasId",
      });
  
      return Number(nextCanvasId); // convert from BigInt if needed
    } catch (error) {
      console.error("Error getting nextCanvasId", error);
      return -1;
    }
  };

  export const mintCanvasSc = async (
    chainId: any,
    json: any,
    ipfsUrl: any,
    walletClient: any,
    account: any,
    owner1: any,
    owner2: any
  ) => {
    try {
      const schema = [
        {
          name: "LSP4Metadata",
          key: "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e",
          keyType: "Singleton",
          valueType: "bytes",
          valueContent: "VerifiableURI",
        },
      ];
      const erc725 = new ERC725(schema);
  
      const encodedData = erc725.encodeData([
        {
          keyName: "LSP4Metadata",
          value: {
            json: json,
            url: ipfsUrl,
          },
        },
      ]);
  
      const txHash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: abi.abi,
        functionName: "mintCanvas",
        args: [encodedData.values[0], owner1, owner2],
        account: account,
      });
  
      const publicClient = createPublicClient({
        chain: chainId === 42 ? lukso : luksoTestnet,
        transport: http(),
      });
  
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
  
      return 1;
    } catch (error) {
      console.error("Error", error);
      throw new Error("Failed");
    }
  };
  