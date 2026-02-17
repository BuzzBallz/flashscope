// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {SimplePool} from "../src/SimplePool.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @title Redeploy6Pools — Redeploy all 6 pools with resetPool() support
/// @notice Use this when you need to redeploy pools with the updated SimplePool contract
/// @dev Requires 3000 WMON + gas. Run: PRIVATE_KEY=0x... forge script script/Redeploy6Pools.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
contract Redeploy6Pools is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        MockUSDC usdc = MockUSDC(0xe8cc35BA27De935972d78348B9E43bF6F97c2444);
        address WMON = 0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541;

        vm.startBroadcast(deployerKey);

        // Mint USDC
        usdc.mint(deployer, 100_000 * 1e6);

        // Deploy 6 pools with updated SimplePool (includes resetPool)
        SimplePool pool1 = new SimplePool(WMON, address(usdc), "Uniswap V4");
        SimplePool pool2 = new SimplePool(WMON, address(usdc), "Curve");
        SimplePool pool3 = new SimplePool(WMON, address(usdc), "Trader Joe");
        SimplePool pool4 = new SimplePool(WMON, address(usdc), "Kuru");
        SimplePool pool5 = new SimplePool(WMON, address(usdc), "Clober");
        SimplePool pool6 = new SimplePool(WMON, address(usdc), "Ambient");

        // Check WMON balance
        uint256 wmonBal = IERC20(WMON).balanceOf(deployer);
        console.log("WMON balance:", wmonBal);
        require(wmonBal >= 3000 ether, "Need 3000 WMON -- wrap more MON first");

        // Seed pools
        IERC20(WMON).approve(address(pool1), 500 ether);
        usdc.approve(address(pool1), 11_000 * 1e6);
        pool1.addLiquidity(500 ether, 11_000 * 1e6);

        IERC20(WMON).approve(address(pool2), 500 ether);
        usdc.approve(address(pool2), 11_075 * 1e6);
        pool2.addLiquidity(500 ether, 11_075 * 1e6);

        IERC20(WMON).approve(address(pool3), 500 ether);
        usdc.approve(address(pool3), 11_150 * 1e6);
        pool3.addLiquidity(500 ether, 11_150 * 1e6);

        IERC20(WMON).approve(address(pool4), 500 ether);
        usdc.approve(address(pool4), 10_925 * 1e6);
        pool4.addLiquidity(500 ether, 10_925 * 1e6);

        IERC20(WMON).approve(address(pool5), 500 ether);
        usdc.approve(address(pool5), 11_225 * 1e6);
        pool5.addLiquidity(500 ether, 11_225 * 1e6);

        IERC20(WMON).approve(address(pool6), 500 ether);
        usdc.approve(address(pool6), 11_050 * 1e6);
        pool6.addLiquidity(500 ether, 11_050 * 1e6);

        vm.stopBroadcast();

        console.log("");
        console.log("=== NEW 6-POOL DEPLOYMENT (with resetPool) ===");
        console.log("Pool 1 (Uniswap V4):  ", address(pool1), " -- $22.00");
        console.log("Pool 2 (Curve):        ", address(pool2), " -- $22.15");
        console.log("Pool 3 (Trader Joe):   ", address(pool3), " -- $22.30");
        console.log("Pool 4 (Kuru):         ", address(pool4), " -- $21.85");
        console.log("Pool 5 (Clober):       ", address(pool5), " -- $22.45");
        console.log("Pool 6 (Ambient):      ", address(pool6), " -- $22.10");
        console.log("");
        console.log("UPDATE bot/src/config.ts WITH THESE NEW ADDRESSES!");
        console.log("Then run ResetPrices.s.sol to reset prices before demo.");
    }
}
