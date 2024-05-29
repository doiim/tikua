
import {
    createPublicClient, createWalletClient, http, encodeAbiParameters, parseEther
} from 'viem'
import { localhost } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua, getCartesiContractAbi } from '@doiim/tikua'

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

const publicClient = createPublicClient({
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
// const encodedData = encodeAbiParameters(
//     [
//         { name: 'from', type: 'address' },
//         { name: 'amount', type: 'uint256' },
//         { name: 'text', type: 'string' },
//     ],
//     [account.address, parseEther('1000'), 'wagmi']
// )
// console.log('Encoded data: ', decoded)
// Request increase the conter using Cartesi Machine
// await tikua('requestIncreaseCounter', [counterAddress]);
const hash = await tikua.depositEther(parseEther('1000'), '');
const portalAbi = getCartesiContractAbi('EtherPortal');
await publicClient.waitForTransactionReceipt({ hash, abi: portalAbi });

console.log('Deposit Ether request sent.')