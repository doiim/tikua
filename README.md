# Cartesi SDK

Our idea is to create a package that simplifies implementation on frontend tricky tasks like deal with Parameters conversion, payload processing, send/receive protocols.

We aim to create a Isomorphic JS package to use with any visual library on Browser or Terminal. The SDK will support any provider or network. All configurable and allowing defining an app with multiple chains supported. The SDK should adapt accordingly to the configurations and raise warnings in cases of non-supported provider chains.

## Installation

```sh
npm install -s cartesi-sdk
```

## Usage

### CartesiSDK

The `CartesiSDK` class is the main entry point for this SDK. It is instantiated with the following parameters:

- `dappAddress`: The address of your dapp.
- `dappEndpoint`: The endpoint of your dapp.
- `provider`: The EIP1193 provider to use.
- `abi`: The ABI of your dapp.
- `waitBlocks`: The amount of blocks to wait before considering an input sent. Defaults to 1.
- `account`: The account to sign transactions. Defaults to the first account returned from `getAddresses()` on the provider.

```ts
const abi = parseAbi([
  "function attackDragon(uint256 dragonId, string weapon)",
]);
const cartesi = new CartesiSDK(
  "0x0123123",
  "https://host.backend/",
  provider,
  abi
);
```

#### `sendInput(fn: string, args: any[])`

Send a function input to the Cartesi contract.

- `fn: string`: The name of the function to call.
- `args: any[]`: An array of arguments to pass to the function.

Returns a promise that resolves to the transaction hash of the sent input.

```ts
const txHash = await cartesi.sendInput("attackDragon", [1, "sword"]);
```

#### `fetchInspect(id: string)`

Fetch the inspect data for a transaction ID.

- `id: string`: The ID of the transaction to fetch.

Returns a promise that resolves to the inspect data of the transaction.

#### `addNoticesListener(pollInterval : number, fn: (report: any) => void)`

Listen for all notices triggered by the Cartesi Machine

- `pollInterval: number`: Time between each request to GraphQL.
- `fn: (report: any) => void`: The function to call when a report is received.

```ts
const unsubscribe = await cartesi.addNoticesListener(1000, (result) => {
  console.log(result);
});
```

Returns an unsubscribe function to stop listening for reports.

## For Maintainers

To deploy a new version use:

```sh
npm run deploy
```
