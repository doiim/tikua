
import { createWalletClient, http } from 'viem'
import { localhost } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua } from '@doiim/tikua'

const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(testPrivateKey)

// Defining Dapp ABI
const abi = [
    "function requestIncreaseCounter(address counterAddress)",
];

const client = createWalletClient({
    account,
    chain: localhost,
    transport: http(),
})

const tikua = new Tikua({
    appEndpoint: 'http://localhost:8080',
    appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    provider: client,
    abi: abi
})

await tikua.sendInput('requestIncreaseCounter', ['0x59b670e9fa9d0a427751af201d676719a970857b']);