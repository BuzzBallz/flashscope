// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SimplePool — Constant-product AMM with flash loan for FlashScope
/// @notice Simulates a DEX pool. Two instances with different prices = arbitrage opportunity.
/// @dev x * y = k model. Flash loans follow a callback pattern.

interface IFlashBorrower {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external;
}

contract SimplePool {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    string public name;
    uint256 public constant SWAP_FEE_BPS = 30; // 0.3% fee
    uint256 public constant FLASH_FEE_BPS = 5;  // 0.05% flash loan fee

    address public owner;
    bool private locked;

    event Swap(address indexed sender, address indexed tokenIn, uint256 amountIn, uint256 amountOut);
    event FlashLoan(address indexed borrower, address indexed token, uint256 amount, uint256 fee);
    event LiquidityAdded(uint256 amount0, uint256 amount1);

    modifier noReentrant() {
        require(!locked, "Reentrant");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _token0, address _token1, string memory _name) {
        require(_token0 != _token1, "Same token");
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        name = _name;
        owner = msg.sender;
    }

    /// @notice Add liquidity — sets the price ratio.
    function addLiquidity(uint256 amount0, uint256 amount1) external {
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
        reserve0 += amount0;
        reserve1 += amount1;
        emit LiquidityAdded(amount0, amount1);
    }

    /// @notice Swap tokenIn for tokenOut. Constant product with 0.3% fee.
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external noReentrant returns (uint256 amountOut) {
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        require(amountIn > 0, "Zero amount");

        bool isToken0In = tokenIn == address(token0);

        (uint256 reserveIn, uint256 reserveOut) = isToken0In
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        // amountOut = reserveOut * amountInAfterFee / (reserveIn + amountInAfterFee)
        uint256 amountInAfterFee = amountIn * (10000 - SWAP_FEE_BPS) / 10000;
        amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);

        require(amountOut >= minAmountOut, "Slippage");
        require(amountOut < reserveOut, "Insufficient liquidity");

        // Transfer in
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Transfer out
        address tokenOut = isToken0In ? address(token1) : address(token0);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        // Update reserves
        if (isToken0In) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    /// @notice Flash loan — borrow tokens, execute callback, repay + fee
    function flash(
        address borrower,
        address token,
        uint256 amount,
        bytes calldata data
    ) external noReentrant {
        require(token == address(token0) || token == address(token1), "Invalid token");

        uint256 balBefore = IERC20(token).balanceOf(address(this));
        require(amount <= balBefore, "Insufficient liquidity for flash");

        uint256 fee = (amount * FLASH_FEE_BPS) / 10000;

        // Send tokens to borrower
        IERC20(token).safeTransfer(borrower, amount);

        // Callback
        IFlashBorrower(borrower).onFlashLoan(address(this), token, amount, fee, data);

        // Verify repayment
        uint256 balAfter = IERC20(token).balanceOf(address(this));
        require(balAfter >= balBefore + fee, "Flash loan not repaid");

        // Update reserves
        if (token == address(token0)) {
            reserve0 = balAfter;
        } else {
            reserve1 = balAfter;
        }

        emit FlashLoan(borrower, token, amount, fee);
    }

    /// @notice Owner-only: reset pool reserves for demo reset
    /// @dev Sends all tokens back to owner, then pulls new amounts
    function resetPool(uint256 newReserve0, uint256 newReserve1) external {
        require(msg.sender == owner, "Not owner");
        // Return current tokens to owner
        uint256 bal0 = token0.balanceOf(address(this));
        uint256 bal1 = token1.balanceOf(address(this));
        if (bal0 > 0) token0.safeTransfer(owner, bal0);
        if (bal1 > 0) token1.safeTransfer(owner, bal1);
        // Pull new liquidity from owner
        token0.safeTransferFrom(owner, address(this), newReserve0);
        token1.safeTransferFrom(owner, address(this), newReserve1);
        reserve0 = newReserve0;
        reserve1 = newReserve1;
    }

    /// @notice Get current price of token0 in terms of token1 (scaled by 1e18)
    function getPrice() external view returns (uint256) {
        if (reserve0 == 0) return 0;
        return (reserve1 * 1e18) / reserve0;
    }

    /// @notice Get reserves — used by scanner
    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1) {
        return (reserve0, reserve1);
    }

    /// @notice Get quote for a swap without executing
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        bool isToken0In = tokenIn == address(token0);
        (uint256 reserveIn, uint256 reserveOut) = isToken0In
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        uint256 amountInAfterFee = amountIn * (10000 - SWAP_FEE_BPS) / 10000;
        return (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
    }
}
