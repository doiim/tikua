import { Address, Abi, decodeFunctionData } from 'viem'
import { ChainName, ContractName, NoticeDecoded, NoticesRawObject, namesByChain } from './types.js';

/**
 * Retrieves the deployment address for a given contract on a specified chain.
 *
 * @param {number | AddressLike} chainId - The ID of the chain or the address of the chain.
 * @param {ContractName} contract - The name of the contract to retrieve the deployment address for.
 * @return {string} The deployment address of the specified contract.
 */
export const getCartesiDeploymentAddress = async (chainId: number | Address, contract: ContractName) => {
    const decoded = (typeof chainId === 'number' ? '0x' + chainId.toString(16) : chainId) as ChainName;
    // We replace network foundry with Mainnet cause it is the same addresses
    // @ts-ignore
    const deploymentAddresses = (await import(`../deployments/${decoded == '0x7a69' ? 'mainnet' : namesByChain[decoded as ChainName]}.json`, { assert: { type: "json" } })).default as { [key: string]: string };
    return deploymentAddresses[contract] as Address
}

/**
 * Retrieves the ABI (Application Binary Interface) of a Cartesi contract based on the provided contract name.
 *
 * @param {number | Address} chainId - The ID or address of the chain to retrieve the contract ABI from.
 * @param {ContractName} contract - The name of the contract to retrieve the ABI for.
 * @return {any[]} The ABI of the specified Cartesi contract.
 */
export const getCartesiContractAbi = async (contract: ContractName) => {
    // @ts-ignore
    return (await import(`../abis/${contract}.json`, { assert: { type: "json" } })).default as Abi;
}

/**
 * Decodes the notices object into an array of decoded notices.
 *
 * @param {noticesRawObject} notices - The notices object to be decoded.
 * @param {Abi} abi - The ABI (Application Binary Interface) used for decoding.
 * @return {NoticeDecoded[]} An array of decoded notices.
 */
export const decodeNotices = (notices: NoticesRawObject, abi: Abi) => {
    return notices.edges.map((edge) => {
        return {
            index: edge.node.input.index,
            msgSender: edge.node.input.msgSender,
            timestamp: new Date(Number(edge.node.input.timestamp) * 1000),
            payload: decodeFunctionData({ abi, data: edge.node.payload as `0x${string}` })
        }
    }) as NoticeDecoded[]
}