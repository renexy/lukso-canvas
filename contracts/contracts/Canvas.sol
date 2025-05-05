// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";

contract Canvas is LSP8IdentifiableDigitalAsset {
    uint256 public nextCanvasId;

    constructor(
        string memory name_,
        string memory symbol_,
        address newOwner_,
        uint8 lsp4TokenType_,
        uint8 lsp8TokenIdFormat_,
        bytes memory metadata
    )
        LSP8IdentifiableDigitalAsset(
            name_,
            symbol_,
            newOwner_,
            lsp4TokenType_,
            lsp8TokenIdFormat_
        )
    {
        _setData(hex"9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", metadata);
    }

function mintCanvas(bytes memory metadata, address owner1, address owner2) external payable {
    // Mint the first NFT to your address (owner1)
    bytes32 tokenId = bytes32(nextCanvasId);
    _mint(owner1, tokenId, true, "");
    _setDataForTokenId(tokenId, hex"9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", metadata);
    
    // Increment for the next token
    nextCanvasId++;

    // Mint the second NFT to your address (owner1) as well
    bytes32 tokenId2 = bytes32(nextCanvasId);
    _mint(owner1, tokenId2, true, "");
    _setDataForTokenId(tokenId2, hex"9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", metadata);
    
    // Transfer the second NFT to owner2
    _transfer(owner1, owner2, tokenId2, true, "");

    // Increment for the next token
    nextCanvasId++;
}

}
