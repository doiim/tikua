# Vouchers Example Template - Tikua SDK

This is a [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/1.3/quickstart/) template for Cartesi applications that use the [Deroll](https://github.com/tuler/deroll) framework.

## Usage

First be sure that you have Cartesi CLI installed on your machine. You will also be required to have Docker installed.

```sh
cartesi build
```

After generating the Docker machine files you can just run the Cartesi Machine using, it is recocmended to set an epoch duration otherwise it would take to long for the Cartesi Machine to generate the proofs for vouchers:

```sh
cartesi run --epoch-duration 5
```

Now on a different terminal you can install dependencies, compile contracts and deploy them:

```sh
npm install
npx hardhat compile
node scripts/1-deploy-contract.js
```

**After run all the scripts above you will see an output with the smart-contract address deployed to be used on node examples.**

## Troubleshooting

Check the command `cartesi doctor` to check if the machine has all requirements to run Cartesi Rollups.

## References

For documentation on how to develop Cartesi applications refer to https://docs.cartesi.io

For documentation on how to use Deroll refer to https://github.com/tuler/deroll
