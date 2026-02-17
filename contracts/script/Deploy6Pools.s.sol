// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {SimplePool} from "../src/SimplePool.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract Deploy6Pools is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // Existing deployed contracts
        MockUSDC usdc = MockUSDC(0xe8cc35BA27De935972d78348B9E43bF6F97c2444);
        address WMON = 0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541;

        vm.startBroadcast(deployerKey);

        // Mint additional USDC for seeding (100K should be plenty)
        usdc.mint(deployer, 100_000 * 1e6);

        // Deploy 6 pools
        SimplePool pool1 = new SimplePool(WMON, address(usdc), "Uniswap");
        SimplePool pool2 = new SimplePool(WMON, address(usdc), "Curve");
        SimplePool pool3 = new SimplePool(WMON, address(usdc), "SushiSwap");
        SimplePool pool4 = new SimplePool(WMON, address(usdc), "Kuru");
        SimplePool pool5 = new SimplePool(WMON, address(usdc), "Balancer");
        SimplePool pool6 = new SimplePool(WMON, address(usdc), "PancakeSwap");

        console.log("Pool 1 (Uniswap):     ", address(pool1));
        console.log("Pool 2 (Curve):        ", address(pool2));
        console.log("Pool 3 (SushiSwap):    ", address(pool3));
        console.log("Pool 4 (Kuru):         ", address(pool4));
        console.log("Pool 5 (Balancer):     ", address(pool5));
        console.log("Pool 6 (PancakeSwap):  ", address(pool6));

        // Check WMON balance — need 3000 total
        uint256 wmonBal = IERC20(WMON).balanceOf(deployer);
        console.log("WMON balance:", wmonBal);
        require(wmonBal >= 3000 ether, "Need 3000 WMON -- wrap more MON first");

        // Seed each pool
        // Pool 1: Uniswap — 500 WMON + 11,000 USDC ($22.00)
        IERC20(WMON).approve(address(pool1), 500 ether);
        usdc.approve(address(pool1), 11_000 * 1e6);
        pool1.addLiquidity(500 ether, 11_000 * 1e6);

        // Pool 2: Curve — 500 WMON + 11,075 USDC ($22.15)
        IERC20(WMON).approve(address(pool2), 500 ether);
        usdc.approve(address(pool2), 11_075 * 1e6);
        pool2.addLiquidity(500 ether, 11_075 * 1e6);

        // Pool 3: SushiSwap — 500 WMON + 11,150 USDC ($22.30)
        IERC20(WMON).approve(address(pool3), 500 ether);
        usdc.approve(address(pool3), 11_150 * 1e6);
        pool3.addLiquidity(500 ether, 11_150 * 1e6);

        // Pool 4: Kuru — 500 WMON + 10,925 USDC ($21.85)
        IERC20(WMON).approve(address(pool4), 500 ether);
        usdc.approve(address(pool4), 10_925 * 1e6);
        pool4.addLiquidity(500 ether, 10_925 * 1e6);

        // Pool 5: Balancer — 500 WMON + 11,225 USDC ($22.45)
        IERC20(WMON).approve(address(pool5), 500 ether);
        usdc.approve(address(pool5), 11_225 * 1e6);
        pool5.addLiquidity(500 ether, 11_225 * 1e6);

        // Pool 6: PancakeSwap — 500 WMON + 11,050 USDC ($22.10)
        IERC20(WMON).approve(address(pool6), 500 ether);
        usdc.approve(address(pool6), 11_050 * 1e6);
        pool6.addLiquidity(500 ether, 11_050 * 1e6);

        vm.stopBroadcast();

        console.log("");
        console.log("=== 6-POOL DEPLOYMENT SUMMARY ===");
        console.log("Pool 1 (Uniswap):     ", address(pool1), " -- $22.00");
        console.log("Pool 2 (Curve):        ", address(pool2), " -- $22.15");
        console.log("Pool 3 (SushiSwap):    ", address(pool3), " -- $22.30");
        console.log("Pool 4 (Kuru):         ", address(pool4), " -- $21.85");
        console.log("Pool 5 (Balancer):     ", address(pool5), " -- $22.45");
        console.log("Pool 6 (PancakeSwap):  ", address(pool6), " -- $22.10");
        console.log("");
        console.log("Best spread: Kuru ($21.85) -> Balancer ($22.45) = 274 bps");
        console.log("");
        console.log("UPDATE bot/src/config.ts WITH THESE ADDRESSES!");
    }
}
