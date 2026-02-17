// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {FlashAggregator} from "../src/FlashAggregator.sol";
import {IUniswapV3Factory} from "../src/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "../src/interfaces/IUniswapV3Pool.sol";
import {IQuoterV2} from "../src/interfaces/IQuoterV2.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @notice Fork test against Monad mainnet
/// Run: forge test --fork-url https://rpc.monad.xyz -vvv
contract FlashAggregatorTest is Test {
    // --- Verified addresses from ADDRESSES.md ---
    address constant WMON = 0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A;
    address constant USDC = 0x754704Bc059F8C67012fEd69BC8A327a5aafb603;
    address constant WETH = 0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242;
    address constant SWAP_ROUTER = 0xfE31F71C1b106EAc32F1A19239c9a9A72ddfb900;
    address constant V3_FACTORY = 0x204FAca1764B154221e35c0d20aBb3c525710498;
    address constant QUOTER_V2 = 0x661E93cca42AfacB172121EF892830cA3b70F08d;

    FlashAggregator public agg;
    address public deployer;

    function setUp() public {
        deployer = address(this);
        agg = new FlashAggregator(SWAP_ROUTER);
    }

    // ============================================================
    // Test 1: Deploy — verify owner and router
    // ============================================================
    function test_deploy() public view {
        assertEq(agg.owner(), deployer, "Owner should be deployer");
        assertEq(address(agg.swapRouter()), SWAP_ROUTER, "Router mismatch");
    }

    // ============================================================
    // Test 2: Discover WMON/USDC pool on Uniswap V3
    // ============================================================
    function test_discoverPool() public {
        IUniswapV3Factory factory = IUniswapV3Factory(V3_FACTORY);

        // Try common fee tiers: 500 (0.05%), 3000 (0.3%), 10000 (1%)
        address pool500 = factory.getPool(WMON, USDC, 500);
        address pool3000 = factory.getPool(WMON, USDC, 3000);
        address pool10000 = factory.getPool(WMON, USDC, 10000);

        emit log_named_address("WMON/USDC pool (500)", pool500);
        emit log_named_address("WMON/USDC pool (3000)", pool3000);
        emit log_named_address("WMON/USDC pool (10000)", pool10000);

        // At least one pool should exist
        bool found = pool500 != address(0) || pool3000 != address(0) || pool10000 != address(0);
        assertTrue(found, "No WMON/USDC pool found on Uniswap V3");
    }

    // ============================================================
    // Test 3: Swap WMON → USDC on Uniswap V3
    // ============================================================
    function test_swapWMONtoUSDC() public {
        // Find active pool
        uint24 fee = _findActiveFee(WMON, USDC);
        require(fee > 0, "No active WMON/USDC pool");

        uint256 swapAmount = 0.1 ether; // 0.1 WMON

        // Deal WMON to the aggregator contract
        deal(WMON, address(agg), swapAmount);
        assertEq(IERC20(WMON).balanceOf(address(agg)), swapAmount, "Deal failed");

        // Execute swap via the public swapExact function
        uint256 usdcBefore = IERC20(USDC).balanceOf(address(agg));
        uint256 amountOut = agg.swapExact(WMON, USDC, swapAmount, fee);

        uint256 usdcAfter = IERC20(USDC).balanceOf(address(agg));

        emit log_named_uint("WMON in", swapAmount);
        emit log_named_uint("USDC out", amountOut);
        emit log_named_uint("USDC balance delta", usdcAfter - usdcBefore);
        emit log_named_uint("Fee tier", fee);

        assertGt(amountOut, 0, "Swap returned 0");
        assertEq(usdcAfter - usdcBefore, amountOut, "Balance mismatch");
    }

    // ============================================================
    // Test 4: Flash loan on WMON/USDC pool
    // Uses fee=500 pool for flash borrow, fee=3000 pool for swaps
    // (can't swap on same pool during flash — LOK reentrancy lock)
    // ============================================================
    function test_flashLoan() public {
        IUniswapV3Factory factory = IUniswapV3Factory(V3_FACTORY);

        // Borrow from the 500 fee pool
        address flashPool = factory.getPool(WMON, USDC, 500);
        require(flashPool != address(0), "No 500 pool");

        // Swap through the 3000 fee pool (different pool = no LOK)
        address swapPool = factory.getPool(WMON, USDC, 3000);
        require(swapPool != address(0), "No 3000 pool");

        uint128 flashLiq = IUniswapV3Pool(flashPool).liquidity();
        uint128 swapLiq = IUniswapV3Pool(swapPool).liquidity();
        emit log_named_uint("Flash pool (500) liquidity", flashLiq);
        emit log_named_uint("Swap pool (3000) liquidity", swapLiq);

        if (flashLiq == 0 || swapLiq == 0) {
            emit log("Insufficient liquidity, skipping flash test");
            return;
        }

        // Flash borrow from 500 pool, swap through 3000 pool
        // Expected to revert "Not profitable" (fees eat the arb on same pair)
        uint256 borrowAmount = 0.01 ether;
        vm.expectRevert("Not profitable");
        agg.executeArbitrage(flashPool, true, borrowAmount, 3000, 3000);
    }

    // ============================================================
    // Test 5: Quote check via QuoterV2
    // ============================================================
    function test_quoterWorks() public {
        uint24 fee = _findActiveFee(WMON, USDC);
        require(fee > 0, "No active pool");

        IQuoterV2 quoter = IQuoterV2(QUOTER_V2);
        uint256 amountIn = 1 ether; // 1 WMON

        (uint256 amountOut,,,) = quoter.quoteExactInputSingle(
            IQuoterV2.QuoteExactInputSingleParams({
                tokenIn: WMON,
                tokenOut: USDC,
                amountIn: amountIn,
                fee: fee,
                sqrtPriceLimitX96: 0
            })
        );

        emit log_named_uint("Quote: 1 WMON -> USDC", amountOut);
        assertGt(amountOut, 0, "Quote returned 0");
    }

    // ============================================================
    // Helper: find first active fee tier for a token pair
    // ============================================================
    function _findActiveFee(address tokenA, address tokenB) internal view returns (uint24) {
        IUniswapV3Factory factory = IUniswapV3Factory(V3_FACTORY);
        uint24[3] memory fees = [uint24(500), uint24(3000), uint24(10000)];

        for (uint256 i = 0; i < fees.length; i++) {
            address pool = factory.getPool(tokenA, tokenB, fees[i]);
            if (pool != address(0)) {
                // Check if pool has liquidity
                try IUniswapV3Pool(pool).liquidity() returns (uint128 liq) {
                    if (liq > 0) return fees[i];
                } catch {}
            }
        }

        // Return first existing pool even without liquidity
        for (uint256 i = 0; i < fees.length; i++) {
            address pool = factory.getPool(tokenA, tokenB, fees[i]);
            if (pool != address(0)) return fees[i];
        }

        return 0;
    }
}
