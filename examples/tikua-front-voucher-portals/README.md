# Client Example - Tikua SDK

This example project demonstrates how to use the Tikua client in a JavaScript frontend application. The project uses React and includes an example of how to interact with a dapp deployed on the network. It provides a simple user interface to send inputs to the dapp, drink potions, and check the hero status.

Overall, this example project should help you get started with using the Cartesi SDK client in a JavaScript frontend application.

## Installation

[!IMPORTANT]
This example **require** that you first run the **tikua-back-portals** example on backend and also deploy contracts contained on README.md.

Be sure that the backend example is running before run this client.

```sh
npm install
npm run dev
```

## Usage

This example contains multiple operations using Cartesi Portals. After connect your wallet on the app you can proceed approving token transfers and executing Vouchers afterwards. The backend will generate a Voucher containing a payload to returns funds back to you.

## References

For documentation on how to develop Cartesi applications refer to https://docs.cartesi.io

For documentation on how to use Deroll refer to https://github.com/tuler/deroll
