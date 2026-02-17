// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IUniswapV3Pool} from "./interfaces/IUniswapV3Pool.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @title FlashAggregator
/// @notice Flash loan arbitrage between DEXs on Monad
contract FlashAggregator {
    address public immutable owner;
    ISwapRouter public immutable swapRouter;

    event ArbitrageExecuted(
        address indexed token0,
        address indexed token1,
        uint256 amountBorrowed,
        uint256 profit,
        string dexBuy,
        string dexSell,
        uint256 executionTimeMs,
        uint256 blockNumber,
        uint256 timestamp
    );

    event ArbitrageFailed(
        address indexed token0,
        address indexed token1,
        string reason,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _swapRouter) {
        owner = msg.sender;
        swapRouter = ISwapRouter(_swapRouter);
    }

    /// @notice Main entry: initiate flash loan
    function executeArbitrage(
        address pool,
        bool borrowToken0,
        uint256 borrowAmount,
        uint24 buyPoolFee,
        uint24 sellPoolFee
    ) external onlyOwner {
        uint256 amount0 = borrowToken0 ? borrowAmount : 0;
        uint256 amount1 = borrowToken0 ? 0 : borrowAmount;
        bytes memory data = abi.encode(pool, buyPoolFee, sellPoolFee);
        IUniswapV3Pool(pool).flash(address(this), amount0, amount1, data);
    }

    /// @notice Callback from Uniswap V3 flash loan
    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external {
        (address pool, uint24 buyFee, uint24 sellFee) = abi.decode(data, (address, uint24, uint24));
        require(msg.sender == pool, "Unauthorized");

        address tkn0 = IUniswapV3Pool(pool).token0();
        address tkn1 = IUniswapV3Pool(pool).token1();

        // Determine borrow direction from fees
        if (fee0 > 0) {
            _executeAndRepay(tkn0, tkn1, fee0, buyFee, sellFee, pool);
        } else {
            _executeAndRepay(tkn1, tkn0, fee1, buyFee, sellFee, pool);
        }
    }

    /// @notice Execute the arbitrage swaps and repay
    function _executeAndRepay(
        address tokenBorrow,
        address tokenOther,
        uint256 fee,
        uint24 buyFee,
        uint24 sellFee,
        address pool
    ) internal {
        uint256 borrowAmount = IERC20(tokenBorrow).balanceOf(address(this));
        uint256 repayAmount = borrowAmount + fee;

        // Buy: borrowed → other
        uint256 received = _swapOnUniswapV3(tokenBorrow, tokenOther, borrowAmount, buyFee);
        // Sell: other → borrowed
        uint256 amountBack = _swapOnUniswapV3(tokenOther, tokenBorrow, received, sellFee);

        require(amountBack >= repayAmount, "Not profitable");

        // Repay flash loan
        IERC20(tokenBorrow).transfer(pool, repayAmount);

        emit ArbitrageExecuted(
            tokenBorrow,
            tokenOther,
            borrowAmount,
            amountBack - repayAmount,
            "uniswap_v3",
            "uniswap_v3",
            0,
            block.number,
            block.timestamp
        );
    }

    /// @notice Swap via Uniswap V3 SwapRouter02
    function _swapOnUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 poolFee
    ) internal returns (uint256 amountOut) {
        IERC20(tokenIn).approve(address(swapRouter), amountIn);
        amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: address(this),
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );
    }

    /// @notice Swap exposed for testing
    function swapExact(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 poolFee
    ) external onlyOwner returns (uint256 amountOut) {
        amountOut = _swapOnUniswapV3(tokenIn, tokenOut, amountIn, poolFee);
    }

    /// @notice Withdraw profits
    function withdrawProfits(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "No profits");
        bool ok = IERC20(token).transfer(owner, bal);
        require(ok, "Transfer failed");
    }

    receive() external payable {}
}
