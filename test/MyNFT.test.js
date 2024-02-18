const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
    let NFT;
    let nft;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        NFT = await ethers.getContractFactory("MyNFT");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        nft = await NFT.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await nft.owner()).to.equal(owner.address);
        });
    });

    describe("Minting", function () {
        it("Should mint a new NFT and assign it to owner", async function () {
            const mintTx = await nft.mint(owner.address, "ipfs://example_token_uri");
            await mintTx.wait();

            expect(await nft.balanceOf(owner.address)).to.equal(1);
            expect(await nft.tokenURI(1)).to.equal("ipfs://example_token_uri");
        });

        it("Should fail if non-owner tries to mint", async function () {
            await expect(nft.connect(addr1).mint(addr1.address, "ipfs://example_token_uri")).to.be.reverted;
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            await nft.mint(owner.address, "ipfs://example_token_uri");
        });

        it("Should transfer NFTs from one account to another", async function () {
            await nft['safeTransferFrom(address,address,uint256)'](owner.address, addr1.address, 1);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);
            expect(await nft.ownerOf(1)).to.equal(addr1.address);
        });

        it("Should fail if sender doesn’t have permission", async function () {
            await expect(nft.connect(addr2)['safeTransferFrom(address,address,uint256)'](owner.address, addr2.address, 1)).to.be.reverted;
        });
    });

    describe("Approvals", function () {
        beforeEach(async function () {
            await nft.mint(owner.address, "ipfs://example_token_uri");
        });

        it("Should set approval for all", async function () {
            const approveTx = await nft.setApprovalForAll(addr1.address, true);
            await approveTx.wait();

            expect(await nft.isApprovedForAll(owner.address, addr1.address)).to.be.true;
        });

        it("Should approve and then transfer NFT with approval", async function () {
            await nft.approve(addr1.address, 1);
            await nft.connect(addr1)['safeTransferFrom(address,address,uint256)'](owner.address, addr2.address, 1);

            expect(await nft.balanceOf(addr2.address)).to.equal(1);
            expect(await nft.ownerOf(1)).to.equal(addr2.address);
        });
    });

    describe("tokenURI", function () {
        it("Should return correct tokenURI after minting", async function () {
            await nft.mint(owner.address, "ipfs://unique_token_uri");
            expect(await nft.tokenURI(1)).to.equal("ipfs://unique_token_uri");
        });
    });
});
