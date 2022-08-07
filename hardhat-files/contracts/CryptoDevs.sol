// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IWhiteList.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    string baseTokenURI;

    IWhitelist whitelist;

    bool public presaleStarted;

    uint256 public presaleEnded;
    bool public _paused;
    uint256 public maxTokenIds = 20;
    uint256 public tokenIds;
    uint256 public _presalePrice = 0.001 ether;
    uint256 public _publicPrice = 0.002 ether;

    constructor(string memory baseURI_, address whitelistContractAddress)
        ERC721("Crypto Devs", "CDV")
    {
        baseTokenURI = baseURI_;
        whitelist = IWhitelist(whitelistContractAddress); //wrap the whitelistContract address in an interface to create an instance of the whitelist contract.
    }

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract is paused");
        _;
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale ended!"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You aren't whitelisted!"
        );
        require(tokenIds < maxTokenIds, "Limit exceeded!");
        require(msg.value >= _presalePrice, "Insuffient ether sent!");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale has not ended yet"
        );
        require(tokenIds < maxTokenIds, "Limit exceeded!");
        require(msg.value >= _publicPrice, "Insuffient ether sent!");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function setPaused(bool val) public onlyOwner {
        //very important to have a pause function!
        _paused = val;
    }

    function withdraw() public onlyOwner {
        address owner = owner();
        uint256 amount = address(this).balance;

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Failed to withdraw eth!");
    }

    receive() external payable {} // for the contract to be able to receive payment

    fallback() external payable {} // for the contract to be able to receive payment
}
