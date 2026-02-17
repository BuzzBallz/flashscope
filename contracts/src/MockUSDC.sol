// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC — Testnet USDC for FlashScope demo
/// @notice Anyone can mint (testnet only). 6 decimals like real USDC.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin (FlashScope)", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Public mint — testnet only, allows audience to get tokens
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Convenience: mint 10,000 USDC to caller
    function faucet() external {
        _mint(msg.sender, 10_000 * 1e6);
    }
}
