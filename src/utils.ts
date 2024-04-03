import { Address, Abi } from 'viem'
import { ChainName, ContractName, namesByChain } from './types';

/**
 * Retrieves the deployment address for a given contract on a specified chain.
 *
 * @param {number | AddressLike} chainId - The ID of the chain or the address of the chain.
 * @param {ContractName} contract - The name of the contract to retrieve the deployment address for.
 * @return {string} The deployment address of the specified contract.
 */
export const getCartesiDeploymentAddress = (chainId: number | Address, contract: ContractName) => {
    const decoded = (typeof chainId === 'number' ? '0x' + chainId.toString(16) : chainId) as ChainName;
    // We replace network foundry with Mainnet cause it is the same addresses
    const deploymentAddresses = require(`./deployments/${decoded == '0x7a69' ? 'mainnet' : namesByChain[decoded as ChainName]}.json`) as { [key: string]: string };
    return deploymentAddresses[contract] as Address
}

/**
 * Retrieves the ABI (Application Binary Interface) of a Cartesi contract based on the provided contract name.
 *
 * @param {number | Address} chainId - The ID or address of the chain to retrieve the contract ABI from.
 * @param {ContractName} contract - The name of the contract to retrieve the ABI for.
 * @return {any[]} The ABI of the specified Cartesi contract.
 */
export const getCartesiContractAbi = function importJSON(contract: ContractName) {
    return require(`./abis/${contract}.json`) as Abi;
}