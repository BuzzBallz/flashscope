// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {SimplePool} from "../src/SimplePool.sol";
import {FlashArbitrageur} from "../src/FlashArbitrageur.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract DeployTestnet is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // WMON is already deployed at the canonical testnet address
        address WMON = 0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541;

        vm.startBroadcast(deployerKey);

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        // 2. Mint USDC for seeding (10M USDC)
        usdc.mint(deployer, 10_000_000 * 1e6);

        // 3. Deploy Pool Alpha (MoonSwap)
        SimplePool poolAlpha = new SimplePool(WMON, address(usdc), "MoonSwap");
        console.log("Pool Alpha (MoonSwap):", address(poolAlpha));

        // 4. Deploy Pool Beta (MonadDEX)
        SimplePool poolBeta = new SimplePool(WMON, address(usdc), "MonadDEX");
        console.log("Pool Beta (MonadDEX):", address(poolBeta));

        // 5. Deploy FlashArbitrageur
        FlashArbitrageur arb = new FlashArbitrageur();
        console.log("FlashArbitrageur:", address(arb));

        // 6. Seed liquidity (requires WMON — deployer must wrap MON first)
        uint256 wmonBalance = IERC20(WMON).balanceOf(deployer);
        console.log("WMON balance:", wmonBalance);

        if (wmonBalance >= 2000 ether) {
            // Pool Alpha: 1000 WMON + 22,000 USDC → price = 22 USDC/WMON
            IERC20(WMON).approve(address(poolAlpha), 1000 ether);
            usdc.approve(address(poolAlpha), 22_000 * 1e6);
            poolAlpha.addLiquidity(1000 ether, 22_000 * 1e6);
            console.log("Pool Alpha seeded: 1000 WMON + 22000 USDC");

            // Pool Beta: 1000 WMON + 22,500 USDC → price = 22.5 USDC/WMON
            // Spread = ~2.3% between Alpha and Beta
            IERC20(WMON).approve(address(poolBeta), 1000 ether);
            usdc.approve(address(poolBeta), 22_500 * 1e6);
            poolBeta.addLiquidity(1000 ether, 22_500 * 1e6);
            console.log("Pool Beta seeded: 1000 WMON + 22500 USDC");
        } else {
            console.log("NOT ENOUGH WMON - seed pools manually after wrapping MON");
            console.log("Run: cast send WMON deposit() --value 2000ether");
        }

        vm.stopBroadcast();

        // Print summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Chain:             Monad Testnet (10143)");
        console.log("MockUSDC:         ", address(usdc));
        console.log("Pool Alpha:       ", address(poolAlpha));
        console.log("Pool Beta:        ", address(poolBeta));
        console.log("FlashArbitrageur: ", address(arb));
        console.log("");
        console.log("Copy these addresses to bot/src/config.ts !");
    }
}
