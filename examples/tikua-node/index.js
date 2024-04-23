
import { createWalletClient, http } from 'viem'
import { localhost } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua } from '@doiim/tikua'

const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(testPrivateKey)

// Defining Dapp ABI
const abi = [
    "struct Dragon { uint256 id; uint256 life; }",
    "function attackDragon(uint256 dragonId)",
    "function drinkPotion()",
    "function heroStatus(address player) returns (uint256)",
    "function dragonStatus(uint256 dragonId) returns (uint256)",
    "function dragonsList() returns (Dragon[])",
];

const client = createWalletClient({
    account,
    chain: localhost,
    transport: http(),
})

const tikua = new Tikua({
    endpoint: 'http://localhost:8080',
    provider: client,
    abi: abi
})

console.log('HERO STATUS:', await tikua.fetchInspect('heroStatus', [account.address]))