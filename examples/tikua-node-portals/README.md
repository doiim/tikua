# Integration with Portals using Tikua SDK on Node

This is a [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/1.3/quickstart/) template for Cartesi applications that use the [Deroll](https://github.com/tuler/deroll) framework.

## Usage

This example **require** that you first run the **tikua-back-portals** example on backend and also deploy contracts contained on README.md.

After you have finished run the Cartesi Machine and deployed contracts locally you can call the script above to send an Input. The backend will generate a Voucher containing a payload to returns funds back to you.

1. Install Dependencies

```sh
npm install
```

2. Run one or more commands above according to the test you want to make.

```sh
node scripts/1-request-deposit-ether.js
node scripts/2-request-deposit-ERC20.js 0x123123..... # ERC20 Token deployed
node scripts/3-request-deposit-ERC721.js 0x123123.... # ERC721 Token deployed
node scripts/4-request-deposit-ERC1155Single.js 0x123123... # ERC1155 Token deployed
node scripts/5-request-deposit-ERC1155Batch.js 0x123123... # ERC1155 Token deployed
```

3. After run some commands above, you can request execute vouchers using command below.

```sh
node scripts/6-execute-vouchers.js
```

**After run all the scripts above you will see an output with the smart-contract address deployed to be used on node examples.**

## References

For documentation on how to develop Cartesi applications refer to https://docs.cartesi.io
