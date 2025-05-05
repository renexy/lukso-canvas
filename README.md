# Lukso Canvas

**Lukso Canvas** is an innovative mini dApp built on the LUKSO blockchain, allowing two users to collaborate in real-time on a shared canvas and mint the artwork as unique NFTs. Each user receives an NFT of the artwork they co-created, enabling a new level of collaboration and ownership within the digital art space.

This project leverages **LUKSO's Universal Profiles (UP)**, **LSP8 (Identifiable Digital Assets)**, and other LUKSO standards to provide seamless user experiences for creators, collectors, and digital artists.

---

## Table of Contents

- [Features](#features)
- [Technical Details](#technical-details)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Real-Time Collaboration**: Two users can draw together on a shared canvas, synced in real-time.
- **Mint as NFT**: Once the canvas is complete, the artwork is minted as an NFT using the LSP8 standard. Both users receive a unique NFT for the artwork they co-created.
- **Universal Profile Integration**: The app leverages **LSP0 (Universal Profile)** for user authentication and ownership.
- **Smart Contract (LSP8)**: The artwork is tokenized as an LSP8 Identifiable Digital Asset, with metadata tied to the creation, including the artwork's IPFS hash and creator details.
- **Cross-Platform Integration**: Seamless interaction with **The Grid** for enhanced social features and visibility of minted NFTs.

---

## Technical Details

- **Frontend**: React-based frontend, built for ease of use and real-time interaction.
  - WebSocket technology ensures the canvas is synced between users.
  - Integrated with **Universal Profile** for authentication.
  
- **Backend**: Smart contracts written in Solidity.
  - Uses **LSP8 (Identifiable Digital Asset)** for minting NFTs.
  - Metadata includes:
    - IPFS file URI of the artwork.
    - Creator addresses.
    - Timestamp of the creation.

- **LUKSO Standards** Used:
  - **LSP0**: Universal Profile for digital identity and asset ownership.
  - **LSP8**: Minting Identifiable Digital Assets (NFTs) tied to collaborative artwork.
  - **LSP1**: Universal Receiver for smart contract interactions.
  - **LSP4**: Digital Asset Metadata for standardized NFT metadata.

---

## Getting Started

To get started with **Lukso Canvas**, follow these steps:

### Prerequisites

- **Node.js**: Version 14.x or higher
- **Metamask** or another browser wallet supporting LUKSO's Universal Profiles.
- **LUKSO Testnet/Network**: You can use the LUKSO test network for testing purposes.

### Install Dependencies

```bash
git clone https://github.com/yourusername/lukso-canvas.git
cd lukso-canvas
npm install
