<p align="center">
  <a href="https://github.com/doiim/cartesi-sdk" title="Tikua Cartesi SDK">
    <img src="https://github.com/doiim/tikua/assets/13040410/27ea5743-61f6-4fc5-b9b5-111ce6023fd7" alt="Tikua logo" width="200" />
  </a>
</p>

# Tikua

A Isomorphic JS Cartesi package to use with any visual library on Browser or Terminal. The SDK will support any provider or network. All configurable and allowing defining an app with multiple chains supported. The SDK should adapt accordingly to the configurations and raise warnings in cases of non-supported provider chains.

## Installation

```sh
npm install -s @doiim/tikua
```

## Usage

You can jump directly to our [Examples](https://github.com/doiim/tikua/tree/master/examples) folder and check how to implement Tikua on multiple platforms or check here the description of Tikua Class and its functions.

### CartesiSDK

The `Tikua` class is the main entry point for this SDK. It is instantiated with the following parameters:

- `abi`: The ABI of your dapp. [Human Readable ABI definition](https://abitype.dev/api/human)
- `provider (optional)`: The EIP1193 provider to use. Needed for Input calls.
- `appAddress (optional)`: The address of your application deployed. Needed for Input calls.
- `appEndpoint (optional)`: The endpoint of your dapp. Needed for Inspect and Notices

- `waitBlocks`: The amount of blocks to wait before considering an input sent. Defaults to 1.
- `signerAddress (optional)`: The account to sign transactions. Defaults to the first account returned from `getAddresses()` on the provider.

```ts
const abi = [
  "function attackDragon(uint256 dragonId, string weapon)",
  "function dragonStatus(uint256 dragonId) returns (uint256)",
];
const tikua = new Tikua({
  appAddress: "0x0123123",
  appEndpoint: "https://host.backend/",
  provider,
  abi,
});
```

#### `sendInput(fn: string, args: any[])`

Send a function input to the Cartesi contract.

- `fn: string`: The name of the function to call.
- `args: any[]`: An array of arguments to pass to the function.

Returns a promise that resolves to the transaction hash of the sent input.

```ts
const txHash = await tikua.sendInput("attackDragon", [1, "sword"]);
```

#### `fetchInspect(id: string)`

Fetch the inspect data for a transaction ID.

- `id: string`: The ID of the transaction to fetch.
- `args: any[]`: Array of arguments to be passed to function.

```ts
const status = await tikua.fetchInspect("dragonStatus", [dragonId]);
```

Returns a promise that resolves to the inspect data of the transaction.

#### `addNoticesListener(pollInterval : number, fn: (report: any) => void)`

Listen for all notices triggered by the Cartesi Machine

- `pollInterval: number`: Time between each request to GraphQL.
- `fn: (report: any) => void`: The function to call when a report is received.

```ts
const unsubscribe = await tikua.addNoticesListener(1000, (result) => {
  console.log(result);
});
```

#### `addMyNoticesListener(pollInterval : number, account:Address,  fn: (report: any) => void)`

Listen for all notices triggered related to your address. This is similar to `addNoticesListener`, but it uses your configured address to filter the results.

- `pollInterval: number`: Time between each request to GraphQL.
- `account: Address`: The account to listen for notices.
- `fn: (report: any) => void`: The function to call when a report is received.

Returns an unsubscribe function to stop listening for reports.

```ts
const myWallet = "0x0123123123123";
const unsubscribe = await tikua.addNoticesListener(1000, myWallet, (result) => {
  console.log(result);
});
```

## Backend

For the backend we use a framework call [Deroll](https://github.com/tuler/deroll). It uses a Typescript backend structure centralized in an ABI protocol same way Tikua. You can start from an example implementation on our [Examples](https://github.com/doiim/tikua/tree/master/examples) folder. There you will find a project using Deroll framework to talk with a frontend using Tikua. Deroll uses ABI for encode and decode function calls/responses, accelerating your development in multiple aspects. Both Deroll and Tikua are based on [Viem](https://viem.sh/) library for encode and decode ABI calls.

## References

[Human Readable ABI definition](https://abitype.dev/api/human)
[Viem library](https://viem.sh/)
[Deroll](https://github.com/tuler/deroll)

## For Maintainers

To deploy a new version use:

```sh
npm run build
npm publish
```

To deploy a local version for tests use:

```sh
npm run build
npm pack
```
