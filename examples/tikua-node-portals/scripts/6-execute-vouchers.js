
import { createPublicClient, createWalletClient, http, isAddress, parseAbi } from 'viem'
import { localhost } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua, getCartesiContractAbi } from '@doiim/tikua'

// Grab counter address from command line arguments
// const counterAddress = process.argv[2]
// if (!counterAddress) throw new Error('Please provide a valid address for Counter.sol contract')
// if (!isAddress(counterAddress)) throw new Error('Counter contract address is not correctly formatted. Use it like: 0x59b670e9fa9d0a427751af201d676719a970857b')

const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(testPrivateKey)

// Defining Dapp ABI
const abi = [
    "function requestIncreaseCounter(address counterAddress)",
    "function increment()",
    "function withdrawEther(address,uint256)",
    "function transferFrom(address,address,uint256)",
    "function transfer(address,uint256)",
    "function safeTransferFrom(address,address,uint256,uint256,bytes)",
    "function safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
];

const client = createWalletClient({
    account,
    chain: localhost,
    transport: http(),
})

const publicClient = createPublicClient({
    chain: localhost,
    transport: http(),
})

const tikua = new Tikua({
    appEndpoint: 'http://localhost:8080',
    appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    provider: client,
    abi: abi
})

// console.log(await tikua.fetchVoucherFromInput(0, 0))
tikua.addVouchersListener(1000, async (result) => {
    console.log('Balance: ', await publicClient.getBalance({ address: account.address }))
    for (const voucher of result) {
        console.log('Was executed?', voucher.input.index, voucher.proof.validity.outputIndexWithinInput, await tikua.checkVoucher(voucher))
        if (!await tikua.checkVoucher(voucher)) {
            console.log('Will execute voucher')
            const hash = await tikua.executeVoucher(voucher)
            const dappAbi = getCartesiContractAbi('CartesiDApp');
            const receipt = await publicClient.waitForTransactionReceipt({ hash, abi: dappAbi });
            console.log(receipt)
            console.log('VOUCHER EXECUTED:', voucher.input.index, voucher.proof.validity.outputIndexWithinInput)
        }
    }
    console.log('\nBalance AFTER: ', await publicClient.getBalance({ address: account.address }))

})

