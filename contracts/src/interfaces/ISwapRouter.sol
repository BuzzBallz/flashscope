// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Interface for Uniswap V3 SwapRouter02 (IV3SwapRouter)
/// SwapRouter02 does NOT include deadline in the struct — deadline is handled
/// via multicall(uint256 deadline, bytes[] data) wrapper if needed.
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(
        ExactInputParams calldata params
    ) external payable returns (uint256 amountOut);
}
