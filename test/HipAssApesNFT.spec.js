const { expect } = require("chai");
const { ethers } = require("hardhat");

let signers;
let hipAssApesNFT;
let sales;
let fee;

describe("HipAssApesNFT", function () {
  beforeEach(async function () {
    signers = await ethers.getSigners();

    const HipAssApesNFT = await ethers.getContractFactory("HipAssApesNFT");
    const HipAssApesNFTSales = await ethers.getContractFactory(
      "HipAssApesNFTSales"
    );

    hipAssApesNFT = await HipAssApesNFT.deploy(signers[0].address);

    fee = "10000000000000000";

    sales = await HipAssApesNFTSales.deploy(
      signers[0].address,
      fee,
        hipAssApesNFT.address
    );

    await hipAssApesNFT.changeMinter(sales.address);

    await sales.addInitialURIs([
      "https://bored-ape.com",
      "https://someothernft.com",
      "https://someothernft.com",
    ]);

    await sales.mint(signers[0].address, 1, {
      value: ethers.utils.parseEther("1.0"),
    });
  });

  it("should set the team address", async function () {
    expect(await hipAssApesNFT.owner()).to.equals(signers[0].address);
  });

  it("should update the total supply", async function () {
    expect((await hipAssApesNFT.totalSupply()).toString()).to.equals("1");
  });

  it("should change the token URI", async function () {
    await hipAssApesNFT.changeTokenURI("1", "new-uri.com");
    expect(await hipAssApesNFT.tokenURI("1")).to.equals("new-uri.com");
  });
});
