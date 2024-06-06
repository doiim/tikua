# Integration with Portals using Tikua SDK on Node

This is a [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/1.3/quickstart/) template for Cartesi applications that use the [Deroll](https://github.com/tuler/deroll) framework.

## Usage

[!IMPORTANT]
This example **require** that you first run the **tikua-back-portals** example on backend and also deploy contracts contained on README.md.

After you have finished run the Cartesi Machine and deployed contracts locally you can call the script above to send an Input. The backend will generate a Voucher containing a payload to returns funds back to you.

1. Install Dependencies

```sh
npm install
```

2. Run one or more commands above according to the test you want to make.

```sh
node scripts/1-request-deposit-ether.js
node scripts/2-request-deposit-ERC20.js 0x59b670e9fa9d0a427751af201d676719a970857b # ERC20 Token
node scripts/3-request-deposit-ERC721.js 0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1 # ERC721 Token
node scripts/4-request-deposit-ERC1155Single.js 0x322813fd9a801c5507c9de605d63cea4f2ce6c44 # ERC1155 Token
node scripts/5-request-deposit-ERC1155Batch.js 0x322813fd9a801c5507c9de605d63cea4f2ce6c44 # ERC1155 Token
```

3. After run some commands above, you can request execute vouchers using command below.

```sh
node scripts/6-execute-vouchers.js
```

**After run all the scripts above you will see an output with the smart-contract address deployed to be used on node examples.**

## References

For documentation on how to develop Cartesi applications refer to https://docs.cartesi.io
