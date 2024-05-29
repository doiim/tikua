// Import necessary modules and functions from the 'viem' library for blockchain interactions
const { createPublicClient, createWalletClient, http } = require('viem');
// Import predefined blockchain environments from 'viem/chains'
const { hardhat } = require('viem/chains');
// Import a utility function for converting a private key into an account object
const { privateKeyToAccount } = require('viem/accounts');

// Import Node.js modules for file system and path manipulation
const fs = require('fs');
const path = require('path');

// Define a test private key for the account to be used
const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
// Convert the private key into an account object
const account = privateKeyToAccount(testPrivateKey)

const getAbiAndBytecode = function (contract) {
    // Construct the path to the contract artifact file
    const artifactPath = path.join('.', 'artifacts', 'contracts', contract, 'MyToken.json');
    // Read the contract artifact file synchronously
    const f = fs.readFileSync(artifactPath, 'utf8')
    // Parse the ABI (Application Binary Interface) from the artifact file
    const abi = JSON.parse(f).abi
    // Parse the bytecode from the artifact file, which is needed for contract deployment
    const bytecode = JSON.parse(f).bytecode
    return { abi, bytecode }
}

// Create a wallet client with the account, specifying the hardhat chain and the HTTP transport
const client = createWalletClient({
    account,
    chain: hardhat,
    transport: http('http://localhost:8545'),
})

// Create a public client for interacting with the blockchain without sending transactions
const publicClient = createPublicClient({
    chain: hardhat,
    transport: http('http://localhost:8545'),
})

const main = async () => {
    for (const contract of ['ERC20.sol', 'ERC721.sol', 'ERC1155.sol']) {
        const { abi, bytecode } = getAbiAndBytecode(contract)
        // Deploy the contract using the wallet client, specifying the ABI, account, constructor arguments, and bytecode
        const hash = await client.deployContract({
            abi,
            account,
            args: [], // Constructor arguments for the contract
            bytecode,
        })
        // Handle the promise returned by deployContract, which resolves with the transaction hash
        console.log('\nTRANSACTION HASH', hash)
        // Wait for the transaction to be mined, specifying the transaction hash
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        // Handle the promise returned by waitForTransactionReceipt, which resolves with the transaction receipt
        console.log('CONTRACT DEPLOYED AT:', contract, receipt.contractAddress)
    }
}

main();