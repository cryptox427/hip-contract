//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IHipAssApesNFT {
    function mint(address, string memory) external;
}

contract HipAssApesNFTSales is AccessControl {
    address public diversifyNFT;

    uint256 public fee;
    uint256 public mintLimit;
    uint256 public minted;

    mapping(uint256 => string) public tokenURIs; // intiial tokenURIs added
    mapping(uint256 => bool) public usedTokenURIs; // used tokenURIs to prevent double mint
    uint256 public tokenURICount;

    // roles
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER");
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public merkleRootWL = 0x1c5d0f521032ee262c7ce93005c49d7e16685b9364f4a3c02282b6d0ddf358bd;

    event ChangeFee(uint256 fee);

    modifier onlyOwner() {
        require(hasRole(ADMIN, msg.sender), "not allowed");
        _;
    }

    constructor(
        address _owner,
        uint256 _fee,
        address _diversifyNFT
    ) {
        fee = _fee;
        diversifyNFT = _diversifyNFT;
        mintLimit = 3000;
        _grantRole(ADMIN, _owner);
    }

    /// @notice Mints the NFT
    /// @param _user Address of the user
    /// @param _quantity Quantity of NFTs to be minted
    function mint(address _user, uint256 _quantity) external payable {
        // check if the contract received fee
        require(msg.value >= fee * _quantity, "underpriced");

        for (uint256 i = 0; i < _quantity; i++) {
            require(minted + 1 <= mintLimit, "cannot mint more");
            // mint the NFT
            IHipAssApesNFT(diversifyNFT).mint(_user, tokenURIs[minted]);
            usedTokenURIs[minted] = true;
            minted = minted + 1;
        }
    }

    /// @notice Mints the NFT to whitelisted user
    /// @param _merkleProof proof of receipt
    /// @param _user Address of the user
    /// @param _quantity Quantity of NFTs to be minted
    function whiteListMint(bytes32[] calldata _merkleProof, address _user, uint256 _quantity) external payable{
        bytes32 leaf = keccak256(abi.encodePacked(_user));
        require(MerkleProof.verify(_merkleProof, merkleRootWL, leaf), "PS: Failed to verify WhiteList");
        // check if the contract received fee
        require(msg.value >= fee * _quantity, "underpriced");

        for (uint256 i = 0; i < _quantity; i++) {
            require(minted + 1 <= mintLimit, "cannot mint more");
            // mint the NFT
            IHipAssApesNFT(diversifyNFT).mint(_user, tokenURIs[minted]);
            usedTokenURIs[minted] = true;
            minted = minted + 1;
        }
    }

    /// @notice add initial token URIs (should be called by team)
    /// @dev each tokenURI will be stored incrementally and same id will be used for minting
    /// @param _tokenURIs array of tokenURIs
    function addInitialURIs(string[] memory _tokenURIs) external onlyOwner {
        for (uint256 i = 0; i < _tokenURIs.length; i++) {
            tokenURICount += 1;
            tokenURIs[tokenURICount] = _tokenURIs[i];
        }
    }

    /// @notice Withdraw the accumulated ETH to address
    /// @param _to where the funds should be sent
    function withdraw(address payable _to) external {
        require(
            hasRole(ADMIN, msg.sender) || hasRole(WITHDRAWER_ROLE, msg.sender),
            "not allowed"
        );
        _to.transfer(address(this).balance);
    }

    /// @notice fallback receive function which keeps ETH in the contract itself
    receive() external payable {}

    /// @notice fallback function which keeps ETH in the contract itself
    fallback() external payable {}

    /// @notice Change minting fee
    function changeFee(uint256 _fee) external onlyOwner {
        fee = _fee;
        emit ChangeFee(_fee);
    }

    /// @notice Grants the withdrawer role
    /// @param _role Role which needs to be assigned
    /// @param _user Address of the new withdrawer
    function grantRole(bytes32 _role, address _user) public override onlyOwner {
        _grantRole(_role, _user);
    }

    /// @notice Revokes the withdrawer role
    /// @param _role Role which needs to be revoked
    /// @param _user Address which we want to revoke
    function revokeRole(bytes32 _role, address _user)
        public
        override
        onlyOwner
    {
        _revokeRole(_role, _user);
    }

    /// @notice Change max limit
    /// @param _mintLimit new max limit
    function changeMintLimit(uint256 _mintLimit) external onlyOwner {
        mintLimit = _mintLimit;
    }

    /// @notice Set New Whitelist
    /// @param _merkleRootWL New Whitelist
    function setMerkleRootWL(bytes32 _merkleRootWL) external onlyOwner {
        merkleRootWL = _merkleRootWL;
    }
}
