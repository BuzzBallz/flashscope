// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title FlashArbitrageur — 3-pool flash loan arbitrage
/// @notice Borrows from Pool A (neutral), sells on Pool B (expensive), buys on Pool C (cheap).
/// @dev Uses 3 separate pools to avoid reentrancy: borrow pool only does flash, others only do swap.

interface ISimplePool {
    function flash(address borrower, address token, uint256 amount, bytes calldata data) external;
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256);
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256);
    function getPrice() external view returns (uint256);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract FlashArbitrageur {
    using SafeERC20 for IERC20;

    address public owner;

    event ArbitrageExecuted(
        address indexed poolBorrow,
        address indexed poolSell,
        address indexed poolBuy,
        uint256 borrowed,
        uint256 profit
    );

    constructor() {
        owner = msg.sender;
    }

    /// @notice Execute 3-pool arbitrage: borrow from poolBorrow, sell on poolSell, buy on poolBuy
    /// @param poolBorrow Pool to flash-borrow from (neutral pool, not used for swaps)
    /// @param poolSell Pool where borrowToken is expensive (sell here for otherToken)
    /// @param poolBuy Pool where borrowToken is cheap (buy back here with otherToken)
    function executeArbitrage(
        address poolBorrow,
        address poolSell,
        address poolBuy,
        address borrowToken,
        uint256 borrowAmount
    ) external {
        bytes memory data = abi.encode(poolSell, poolBuy, borrowToken, borrowAmount);
        ISimplePool(poolBorrow).flash(address(this), borrowToken, borrowAmount, data);
    }

    /// @notice Callback from SimplePool flash loan
    function onFlashLoan(
        address,
        address,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external {
        address pool = msg.sender; // The borrow pool
        (address poolSell, address poolBuy, address borrowToken,) =
            abi.decode(data, (address, address, address, uint256));

        uint256 returned = _executeSwaps(poolSell, poolBuy, borrowToken, amount);

        uint256 repayAmount = amount + fee;
        require(returned >= repayAmount, "Not profitable");

        // Repay the flash loan
        IERC20(borrowToken).safeTransfer(pool, repayAmount);

        emit ArbitrageExecuted(pool, poolSell, poolBuy, amount, returned - repayAmount);
    }

    /// @notice Execute the two-leg swap on separate pools
    function _executeSwaps(
        address poolSell,
        address poolBuy,
        address borrowToken,
        uint256 borrowAmount
    ) internal returns (uint256 returned) {
        address otherToken = _getOtherToken(poolSell, borrowToken);

        // Leg 1: Sell borrowToken → otherToken on expensive pool
        IERC20(borrowToken).approve(poolSell, borrowAmount);
        uint256 received = ISimplePool(poolSell).swap(borrowToken, borrowAmount, 0);

        // Leg 2: Buy borrowToken back with otherToken on cheap pool
        IERC20(otherToken).approve(poolBuy, received);
        returned = ISimplePool(poolBuy).swap(otherToken, received, 0);
    }

    /// @notice Get the other token in a pool pair
    function _getOtherToken(address pool, address token) internal view returns (address) {
        address tkn0 = ISimplePool(pool).token0();
        return token == tkn0 ? ISimplePool(pool).token1() : tkn0;
    }

    /// @notice Owner withdraws accumulated profits
    function withdrawProfits(address token) external {
        require(msg.sender == owner, "Not owner");
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(owner, bal);
        }
    }

    /// @notice Check if 3-pool arbitrage would be profitable (view)
    /// @param poolBorrow Pool to borrow from (for fee calculation)
    /// @param poolSell Pool to sell borrowToken on (expensive)
    /// @param poolBuy Pool to buy borrowToken back on (cheap)
    function checkArbitrage(
        address poolBorrow,
        address poolSell,
        address poolBuy,
        address borrowToken,
        uint256 borrowAmount
    ) external view returns (int256 expectedProfit) {
        address otherToken = _getOtherToken(poolSell, borrowToken);

        // Leg 1: sell borrowToken on poolSell
        uint256 afterSell = ISimplePool(poolSell).getAmountOut(borrowToken, borrowAmount);
        // Leg 2: buy borrowToken on poolBuy
        uint256 afterBuy = ISimplePool(poolBuy).getAmountOut(otherToken, afterSell);

        uint256 repayAmount = borrowAmount + (borrowAmount * 5) / 10000; // 0.05% flash fee
        expectedProfit = int256(afterBuy) - int256(repayAmount);
    }
}
