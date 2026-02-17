// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SimplePool} from "../src/SimplePool.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @title ResetPrices — Reset all 6 pools to their seed prices for demo
/// @notice Requires SimplePool with resetPool() and pools must be redeployed first
/// @dev Run: PRIVATE_KEY=0x... forge script script/ResetPrices.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
contract ResetPrices is Script {
    // 6 pool addresses (from config.ts)
    address constant POOL_UNISWAP    = 0x73E6160f14f73EC12067A72C4dC8657227b221FD;
    address constant POOL_CURVE      = 0x247922B879fee545F20c6eb619917f614522f6bF;
    address constant POOL_SUSHISWAP  = 0x8f34BbEB87ebe6C475ac0d91A991a58ddE020956;
    address constant POOL_KURU       = 0xA3B9BfE1C1839239390ab5377B6FfF2fc4C41C72;
    address constant POOL_BALANCER   = 0x584de30E891d7346f8720951961e29b19E16d4fd;
    address constant POOL_PANCAKE    = 0xB116AD842aaDaea5dcD6eef42BdFD66D78cFD789;

    address constant WMON = 0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541;
    address constant USDC = 0xe8cc35BA27De935972d78348B9E43bF6F97c2444;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        // Approve all pools to pull WMON + USDC
        address[6] memory pools = [
            POOL_UNISWAP, POOL_CURVE, POOL_SUSHISWAP,
            POOL_KURU, POOL_BALANCER, POOL_PANCAKE
        ];

        for (uint i = 0; i < 6; i++) {
            IERC20(WMON).approve(pools[i], type(uint256).max);
            IERC20(USDC).approve(pools[i], type(uint256).max);
        }

        // Reset each pool to seed prices (500 WMON + varying USDC)
        // Pool 1: Uniswap — $22.00 → 500 WMON + 11,000 USDC
        SimplePool(POOL_UNISWAP).resetPool(500 ether, 11_000 * 1e6);
        console.log("Uniswap reset to $22.00");

        // Pool 2: Curve — $22.15 → 500 WMON + 11,075 USDC
        SimplePool(POOL_CURVE).resetPool(500 ether, 11_075 * 1e6);
        console.log("Curve reset to $22.15");

        // Pool 3: SushiSwap — $22.30 → 500 WMON + 11,150 USDC
        SimplePool(POOL_SUSHISWAP).resetPool(500 ether, 11_150 * 1e6);
        console.log("SushiSwap reset to $22.30");

        // Pool 4: Kuru — $21.85 → 500 WMON + 10,925 USDC
        SimplePool(POOL_KURU).resetPool(500 ether, 10_925 * 1e6);
        console.log("Kuru reset to $21.85");

        // Pool 5: Balancer — $22.45 → 500 WMON + 11,225 USDC
        SimplePool(POOL_BALANCER).resetPool(500 ether, 11_225 * 1e6);
        console.log("Balancer reset to $22.45");

        // Pool 6: PancakeSwap — $22.10 → 500 WMON + 11,050 USDC
        SimplePool(POOL_PANCAKE).resetPool(500 ether, 11_050 * 1e6);
        console.log("PancakeSwap reset to $22.10");

        vm.stopBroadcast();

        console.log("");
        console.log("=== ALL 6 POOLS RESET TO SEED PRICES ===");
        console.log("Best spread: Kuru ($21.85) -> Balancer ($22.45) = 274 bps");
    }
}
