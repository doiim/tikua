# Integration with vouchers using Tikua SDK

This is a [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/1.3/quickstart/) template for Cartesi applications that use the [Deroll](https://github.com/tuler/deroll) framework.

## Usage

This example **require** that you first run the **tikua-back-vouchers** example on backend. You could follwoing the instrcutions on their README.md.

After you have finished run the Cartesi Machine and deployed contracts locally you can call the script above to send an Input. The backend will generate a Voucher containing a payload to be called on next script.

1. Install Dependencies

```sh
npm install
```

2. Request Increment counter

```sh
node scripts/1-request-increment.js 0x0YOURDEPLOYEDCOUNTERADDRESS
```

3. The second script will fetch all the Vouchers with proofs and will call executeVoucher to increment the counter on the vouchers not executed yet.

```sh
node scripts/2-execute-voucher.js 0x0YOURDEPLOYEDCOUNTERADDRESS
```

**After run all the scripts above you will see an output with the smart-contract address deployed to be used on node examples.**

## Troubleshooting

Check the command `cartesi doctor` to check if the machine has all requirements to run Cartesi Rollups.

## References

For documentation on how to develop Cartesi applications refer to https://docs.cartesi.io

For documentation on how to use Deroll refer to https://github.com/tuler/deroll
