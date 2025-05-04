import { zeroPadValue } from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Canvas", function () {
  let canvas: { waitForDeployment: () => any; getData: (arg0: string) => any; mintCanvas: (arg0: any, arg1: any, arg2: any) => any; tokenOwnerOf: (arg0: any) => any; getDataForTokenId: (arg0: any, arg1: string) => any; }, owner, addr1: { address: any; }, addr2: { address: any; };
  const metadataKey = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Canvas = await ethers.getContractFactory("Canvas");
    canvas = await Canvas.deploy(
      "CanvasNFT",
      "CNV",
      owner.address,
      0, // lsp4TokenType_
      1, // lsp8TokenIdFormat_
      ethers.toUtf8Bytes("Contract Metadata")
    );
    await canvas.waitForDeployment?.();
  });

  it("should deploy with correct metadata set", async () => {
    const stored = await canvas.getData(metadataKey);
    expect(ethers.toUtf8String(stored)).to.equal("Contract Metadata");
  });

  it("should mint two canvas NFTs with metadata and ownership", async () => {
    const canvasMetadata = ethers.toUtf8Bytes("Canvas Metadata");

    await canvas.mintCanvas(canvasMetadata, addr1.address, addr2.address);

    // Check ownership
    expect(await canvas.tokenOwnerOf(zeroPadValue("0x00", 32))).to.equal(addr1.address);
    expect(await canvas.tokenOwnerOf(zeroPadValue("0x01", 32))).to.equal(addr2.address);

    // Check metadata for both tokens
    const meta1 = await canvas.getDataForTokenId(zeroPadValue("0x00", 32), metadataKey);
    const meta2 = await canvas.getDataForTokenId(zeroPadValue("0x01", 32), metadataKey);

    expect(ethers.toUtf8String(meta1)).to.equal("Canvas Metadata");
    expect(ethers.toUtf8String(meta2)).to.equal("Canvas Metadata");
  });
});
