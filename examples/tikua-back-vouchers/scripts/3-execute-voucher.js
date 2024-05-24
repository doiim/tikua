
import { createWalletClient, http } from 'viem'
import { localhost } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Tikua } from '@doiim/tikua'

const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(testPrivateKey)

// Defining Dapp ABI
const abi = [
    "function requestIncreaseCounter(address counterAddress)",
    "function increment()",
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

console.log(await tikua.fetchVoucherFromInput(0, 0))

// tikua.addMyVouchersListener(1000, account.address, async (result) => {
//     for (const voucher of result) {
//         console.log('INPUT:', voucher.input.index, voucher.proof.validity.outputIndexWithinInput)
//         console.log('WAS EXECUTED:', await tikua.checkVoucher(voucher.input.index, voucher.proof.validity.outputIndexWithinInput))
//         if (!await tikua.checkVoucher(voucher.input.index, voucher.proof.validity.outputIndexWithinInput)) {
//             console.log('Will execute voucher')
//             await tikua.executeVoucher(voucher.destination, voucher.payload, voucher.proof)
//         }
//     }
// })