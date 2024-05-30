import {
    Address,
    Abi,
    decodeFunctionData,
    getAddress,
    fromHex,
    hexToBigInt,
    decodeAbiParameters
} from 'viem'
import {
    ChainName,
    ContractName,
    ERC1155BatchDepositDecoded,
    ERC1155SingleDepositDecoded,
    ERC20DepositDecoded,
    ERC721DepositDecoded,
    EtherDepositDecoded,
    NoticeDecoded,
    NoticesRawObject,
    VoucherDecoded,
    VouchersRawObject,
    namesByChain
} from './types.js';

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

/**
 * Decodes the notices object into an array of decoded notices.
 *
 * @param {VouchersRawObject} notices - The notices object to be decoded.
 * @param {Abi} abi - The ABI (Application Binary Interface) used for decoding.
 * @return {NoticeDecoded[]} An array of decoded notices.
 */
export const decodeVouchers = (vouchers: VouchersRawObject, abi: Abi) => {
    return vouchers.edges.map((edge) => {
        const { functionName, args } = decodeFunctionData({ data: edge.node.payload as `0x${string}`, abi })
        const object = {
            index: edge.node.input.index,
            msgSender: edge.node.input.msgSender,
            timestamp: new Date(Number(edge.node.input.timestamp) * 1000),
            payload: edge.node.payload,
            input: {
                index: edge.node.input.index,
                msgSender: edge.node.input.msgSender,
                timestamp: new Date(Number(edge.node.input.timestamp) * 1000)
            },
            destination: edge.node.destination,
            proof: edge.node.proof,
            decodedPayloadFunction: functionName,
            decodedPayloadArgs: args
        }
        return object
    }) as VoucherDecoded[]
}

/**
 * Decodes the payload of an Ether deposit transaction into an object containing the deposit details.
 *
 * @param {`0x${string}`} payload - The payload of the Ether deposit transaction.
 * @return {EtherDepositDecoded} An object containing the decoded details of the Ether deposit.
 * @throws {Error} If the payload is invalid.
 */
export const decodeEtherDeposit = (payload: `0x${string}`): EtherDepositDecoded => {
    // Decode Ether Deposit parameters returned from Portal + Execution Layer Data
    const regexEther = /^0x([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]*)$/;
    const slicesEther = payload.match(regexEther);
    if (!slicesEther) {
        throw new Error(`Invalid Ether Deposit payload: ${payload}`);
    }
    return {
        from: getAddress(`0x${slicesEther[1]}`),
        amount: BigInt(fromHex(`0x${slicesEther[2]}`, 'number')),
        // This execution Layer data could be used to send custom data
        execLayerData: `0x${slicesEther[3]}`
    }
}

/**
 * Decodes the payload of an ERC20 deposit transaction into an object containing the deposit details.
 *
 * @param {`0x${string}`} payload - The payload of the ERC20 deposit transaction.
 * @return {ERC20DepositDecoded} An object containing the decoded details of the ERC20 deposit.
 * @throws {Error} If the payload is invalid or the ERC20 deposit transaction failed.
 */
export const decodeERC20Deposit = (payload: `0x${string}`): ERC20DepositDecoded => {
    // Decode ERC20 Portal Deposit parameters returned from Portal + Execution Layer Data
    const regexERC20 = /^0x([0-9a-f]{2})([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]*)$/;
    const slicesERC20 = payload.match(regexERC20);
    if (!slicesERC20) {
        throw new Error(`Invalid ERC20 Deposit payload: ${payload}`);
    }
    const ERC20Params = {
        succeded: !!Number(`0x${slicesERC20[1]}`),
        token: getAddress(`0x${slicesERC20[2]}`),
        from: getAddress(`0x${slicesERC20[3]}`),
        amount: hexToBigInt(`0x${slicesERC20[4]}`),
        // This execution Layer data could be used to send custom data
        execLayerData: `0x${slicesERC20[5]}` as `0x${string}`
    }
    if (!ERC20Params.succeded) throw new Error(`ERC20 Deposit transaction failed on Portal: ${payload}`);
    return ERC20Params
}

/**
 * Decodes the payload of an ERC721 deposit transaction into an object containing the deposit details.
 *
 * @param {`0x${string}`} payload - The payload of the ERC721 deposit transaction.
 * @return {ERC721DepositDecoded} An object containing the decoded details of the ERC721 deposit.
 * @throws {Error} If the payload is invalid.
 */
export const decodeERC721Deposit = (payload: `0x${string}`): ERC721DepositDecoded => {
    // Decode ERC721 Portal Deposit parameters returned from Portal + Execution Layer Data
    const regexERC721 = /^0x([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]*)$/;
    const slicesERC721 = payload.match(regexERC721);
    if (!slicesERC721) {
        throw new Error(`Invalid ERC721 Deposit payload: ${payload}`);
    }
    const [baseLayerData, execLayerData] = decodeAbiParameters(
        [
            { name: 'baseLayerData', type: 'string' },
            { name: 'execLayerData', type: 'string' },
        ],
        `0x${slicesERC721[4]}`
    )
    return {
        token: getAddress(`0x${slicesERC721[1]}`),
        from: getAddress(`0x${slicesERC721[2]}`),
        tokenId: hexToBigInt(`0x${slicesERC721[3]}`),
        // This execution Layer data could be used to send custom data
        baseLayerData: baseLayerData as `0x${string}`,
        execLayerData: execLayerData as `0x${string}`
    }
}

/**
 * Decodes the payload of an ERC1155 single deposit transaction into an object containing the deposit details.
 *
 * @param {`0x${string}`} payload - The payload of the ERC1155 single deposit transaction.
 * @return {ERC1155SingleDepositDecoded} An object containing the decoded details of the ERC1155 single deposit.
 * @throws {Error} If the payload is invalid.
 */
export const decodeERC1155SingleDeposit = (payload: `0x${string}`): ERC1155SingleDepositDecoded => {
    // Decode ERC1155 Single Portal Deposit parameters returned from Portal + Execution Layer Data
    const regexERC1155Single = /^0x([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]{64})([0-9a-f]*)$/;
    const slicesERC1155Single = payload.match(regexERC1155Single);
    if (!slicesERC1155Single) {
        throw new Error(`Invalid Single ERC1155 Deposit payload: ${payload}`);
    }
    const [baseLayerData, execLayerData] = decodeAbiParameters(
        [
            { name: 'baseLayerData', type: 'string' },
            { name: 'execLayerData', type: 'string' },
        ],
        `0x${slicesERC1155Single[5]}`
    )
    return {
        token: getAddress(`0x${slicesERC1155Single[1]}`),
        from: getAddress(`0x${slicesERC1155Single[2]}`),
        tokenId: hexToBigInt(`0x${slicesERC1155Single[3]}`),
        amount: hexToBigInt(`0x${slicesERC1155Single[4]}`),
        // This execution Layer data could be used to send custom data
        baseLayerData: baseLayerData as `0x${string}`,
        execLayerData: execLayerData as `0x${string}`
    }
}

/**
 * Decodes the payload of an ERC1155 batch deposit transaction into an object containing the deposit details.
 *
 * @param {`0x${string}`} payload - The payload of the ERC1155 batch deposit transaction.
 * @return {ERC1155BatchDepositDecoded} An object containing the decoded details of the ERC1155 batch deposit.
 * @throws {Error} If the payload is invalid.
 */
export const decodeERC1155BatchDeposit = (payload: `0x${string}`): ERC1155BatchDepositDecoded => {
    // Decode ERC1155 Batch Portal Deposit parameters returned from Portal + Execution Layer Data
    const regexERC1155Batch = /^0x([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]*)$/;
    const slicesERC1155Batch = payload.match(regexERC1155Batch);
    if (!slicesERC1155Batch) {
        throw new Error(`Invalid Batch ERC1155 Deposit payload: ${payload}`);
    }
    // This execution Layer data could be used to send custom data
    const [tokenIds, amounts, baseLayerData, execLayerData] = decodeAbiParameters(
        [
            { name: 'tokenId', type: 'uint256[]' },
            { name: 'amount', type: 'uint256[]' },
            { name: 'baseLayerData', type: 'string' },
            { name: 'execLayerData', type: 'string' },
        ],
        `0x${slicesERC1155Batch[3]}`
    )
    return {
        token: getAddress(`0x${slicesERC1155Batch[1]}`),
        from: getAddress(`0x${slicesERC1155Batch[2]}`),
        tokenIds: tokenIds as bigint[],
        amounts: amounts as bigint[],
        baseLayerData: baseLayerData as `0x${string}`,
        execLayerData: execLayerData as `0x${string}`
    }
}
