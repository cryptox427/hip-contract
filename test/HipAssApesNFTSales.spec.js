const { expect } = require("chai");
const { ethers } = require("hardhat");
const {MerkleTree} = require('merkletreejs');
const SHA3 = require('keccak256');
const {hexlify, arrayify} = require('@ethersproject/bytes');

let signers;
let diversifyNFT;
let sales;
let fee;

let wallet1 = '0x6f99e915Ee5B592a1Fd2203e15B0ECc157B535c8';
let wallet2 = '0xfDC749A1feF80849C376461810bc76fBE87148eA';
let wallet3 = '0x68aFAE7ca01e7a0F397E6b3d2DAd3b317f39325A'

describe("DiversifyNFTSales", function () {
  beforeEach(async function () {
    signers = await ethers.getSigners();

    const DiversifyNFT = await ethers.getContractFactory("DiversifyNFT");
    const DiversifyNFTSales = await ethers.getContractFactory(
      "DiversifyNFTSales"
    );
    // console.log('address----', signers[1].address, wallet1);

    // Put addr1, addr2, addr3 to whitelist
    const wlLeaves = [wallet1, wallet2, wallet3].map(x => SHA3(x));
    this.wlTree = new MerkleTree(wlLeaves, SHA3, {sortPairs: true});
    console.log(this.wlTree.getRoot().toString('hex'));

    diversifyNFT = await DiversifyNFT.deploy(signers[0].address);

    fee = "10000000000000000";

    sales = await DiversifyNFTSales.deploy(
      signers[0].address,
      fee,
      diversifyNFT.address
    );

    await diversifyNFT.changeMinter(sales.address);

    const tx = await sales.addInitialURIs([
      "https://bored-ape.com",
      "https://someothernft.com",
      "https://someothernft.com",
    ]);
  });

  describe("#Mint and #Withdraw", function () {
    beforeEach(async function () {
      await sales.mint(signers[0].address, 1, {
        value: ethers.utils.parseEther("1.0"),
      });
    });

    it("should mint the NFT with correct id", async function () {
      expect(await diversifyNFT.ownerOf(1)).to.equals(signers[0].address);
    });

    it("should should update the minted variable", async function () {
      expect(await sales.minted()).to.equals(1);
    });

    it('should mint to whitelisted user', async function () {
      // Try to mint before initialization (This also includes verification of value sent)
      const proof = this.wlTree.getProof(SHA3(wallet1)).map(p => hexlify(p.data));
      await sales.whiteListMint(proof, wallet1, 2, {
        value: ethers.utils.parseEther("1.0"),
      })
      expect(await sales.minted()).to.equals(3);
    });

    it("should  revert if attached value is less than fee", async function () {
      expect(
        sales.mint(signers[0].address, 2, {
          value: ethers.utils.parseEther("0.001"),
        })
      ).to.be.revertedWith("underpriced");
    });

    it("should withdraw accumulated ETH", async function () {
      await sales.withdraw(signers[2].address);

      expect(await signers[2].getBalance()).to.equals(
        "10001000000000000000000"
      );
    });
  });

  it("should change mint limit", async function () {
    await sales.changeMintLimit("5000");
    expect(await sales.mintLimit()).to.equals("5000");
  });

  it("should change the withdrawer", async function () {
    const role = await sales.WITHDRAWER_ROLE();

    await sales.grantRole(role, signers[3].address);
    expect(await sales.hasRole(role, signers[3].address)).to.equals(true);
  });

  it("should set the owner address", async function () {
    const role = await sales.WITHDRAWER_ROLE();
    await sales.grantRole(role, signers[3].address);
    expect(await sales.hasRole(role, signers[3].address)).to.equals(true);
  });
});

// const DiversifyNFT = artifacts.require('DiversifyNFT');
// const DiversifyNFTSale = artifacts.require('DiversifyNFTSales');
//
// contract('', function ([owner, addr1, addr2, addr3, addr4, addr5, ...addrs]){
//   beforeEach(async function(){
//     this.nft = await DiversifyNFT.new()
//   })
// })
