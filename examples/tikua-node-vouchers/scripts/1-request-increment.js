
import { createWalletClient, http, isAddress } from 'viem'
import { localhost } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua } from '@doiim/tikua'

// Grab counter address from command line arguments
const counterAddress = process.argv[2]
if (!counterAddress) throw new Error('Please provide a valid address for Counter.sol contract')
if (!isAddress(counterAddress)) throw new Error('Counter contract address is not correctly formatted. Use it like: 0x59b670e9fa9d0a427751af201d676719a970857b')

// Setup private key for local test account
const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(testPrivateKey)

// Defining Dapp ABI
const abi = [
    "function requestIncreaseCounter(address counterAddress)",
];

// Create the client for local test wallet
const client = createWalletClient({
    account,
    chain: localhost,
    transport: http(),
})

// Create the Tikua instance
const tikua = new Tikua({
    appEndpoint: 'http://localhost:8080',
    appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    provider: client,
    abi: abi
})

// Request increase the conter using Cartesi Machine
await tikua.sendInput('requestIncreaseCounter', [counterAddress]);

console.log('Request for increase counter sent.')