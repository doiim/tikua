import {
    createWalletClient,
    custom,
    EIP1193Provider,
    Address,
    Abi,
    parseAbi,
    encodeFunctionData,
    createPublicClient,
    decodeFunctionResult,
    extractChain,
    Chain
} from 'viem'
import {
    mainnet,
    sepolia,
    arbitrum,
    arbitrumGoerli,
    arbitrumSepolia,
    optimism,
    optimismGoerli,
    optimismSepolia,
    foundry
} from 'viem/chains'
import {
    AnyVariables,
    Client,
    TypedDocumentNode,
    cacheExchange,
    fetchExchange,
    subscriptionExchange,
} from "@urql/core"
import { decodeNotices, getCartesiContractAbi, getCartesiDeploymentAddress } from './utils';
import { GET_NOTICES_QUERY, SDKParams } from './types';

export class CartesiSDK {
    private readonly provider: EIP1193Provider;
    private readonly dappAddress!: Address;
    private readonly dappEndpoint!: string;
    private readonly dappABI!: Abi;
    private readonly waitBlocks: number = 1;
    private readonly account?: string;
    private timers: number[] = [];

    private chain?: Chain;

    /**
     * Constructor for initializing the SDK with the provided parameters.
     *
     * @param {EIP1193Provider} provider - The provider for the SDK
     * @param {string} address - (optional) The address for the dapp
     * @param {string} endpoint - (optional) The endpoint for the dapp
     * @param {string} abi - (optional) The ABI for the dapp
     * @param {number} waitBlocks - (optional) The number of confirmation blocks after send inputs
     * @param {string} account - (optional) The account for the SDK
     */
    public constructor({ provider, address, endpoint, abi, waitBlocks, account }: SDKParams) {
        this.provider = provider as EIP1193Provider;
        if (address) this.dappAddress = address;
        if (endpoint) this.dappEndpoint = endpoint;
        if (abi) this.dappABI = parseAbi(abi);
        if (waitBlocks) this.waitBlocks = waitBlocks;
        if (account) this.account = account
    }

    /**
     * Get the EIP1193 provider.
     *
     * @return {EIP1193Provider} The EIP1193 provider
     */
    public get getProvider(): EIP1193Provider {
        return this.provider;
    }

    /**
     * Returns the address of the dapp.
     *
     * @return {Address} The address of the dapp.
     */
    public get getAddress(): Address {
        return this.dappAddress;
    }

    /**
     * Assigns the chain based on the provider.
     *
     * This function is async and should be awaited.
     *
     * @return {Promise<void>} Promise that resolves when the chain is assigned.
     */
    public assignChain = async () => {
        const chainId = await this.provider.request({ method: 'eth_chainId' })
        this.chain = extractChain({
            chains: [
                mainnet,
                sepolia,
                arbitrum,
                arbitrumGoerli,
                arbitrumSepolia,
                optimism,
                optimismGoerli,
                optimismSepolia,
                foundry
            ],
            // @ts-ignore
            id: Number(chainId),
        })
    }

    /**
     * Send input to the dapp.
     *
     * @param {string} fn - The name of the function to call according to ABI.
     * @param {any[]} args - The arguments for the function according to ABI.
     * @return {Promise<TransactionResponse>} - A promise that resolves when the input is sent.
     * @throws {Error} - If the chainId is not found in the provider or the Input Box is not found for the selected network.
     */
    public sendInput = async (fn: string, args: any[]): Promise<`0x${string}`> => {
        if (!this.chain) await this.assignChain();
        if (!this.chain) throw new Error('Chain ID not found in selected provider');
        const client = createWalletClient({
            chain: this.chain,
            transport: custom(this.provider)
        })
        const account = this.account as Address || (await client.getAddresses()).shift()
        if (!account) throw new Error('Not able to grab an signer account from provider');

        const publicClient = createPublicClient({
            transport: custom(this.provider)
        })

        // Grab Input Box address from Cartesi on a specific chain.
        const inputBoxAddress = await getCartesiDeploymentAddress(this.chain.id, 'InputBox')
        if (!inputBoxAddress) throw new Error('Input Box not found for the selected network');

        const inputBoxAbi = await getCartesiContractAbi('InputBox')
        if (!inputBoxAbi) throw new Error('Input Box ABI not found for the selected network');

        // Encode the function call send by the user.
        const data = encodeFunctionData({
            abi: this.dappABI,
            functionName: fn,
            args
        })
        // Simulate "AddInput" transaction
        const { request } = await publicClient.simulateContract({
            address: inputBoxAddress,
            abi: inputBoxAbi,
            functionName: 'addInput',
            args: [this.dappAddress, data],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Sends an inspect request to the dapp.
     *
     * @param {string} fn - The name of the function to call according to ABI.
     * @param {any[]} args - The arguments for the function according to ABI.
     * @return {Promise<any>} - A promise that resolves with the result of the function call.
     * @throws {Error} - If there is no endpoint defined for the instance.
     */
    public fetchInspect = async (fn: string, args: any[]) => {
        const payloadRequest = encodeFunctionData({
            abi: this.dappABI,
            functionName: fn,
            args
        })
        const response = await fetch(`${this.dappEndpoint}/inspect/${payloadRequest}`);
        const data = await response.json();
        return decodeFunctionResult({
            abi: this.dappABI,
            functionName: fn,
            data: data.payload
        })
    }

    /**
     * Adds a listener for notices and calls the provided callback with the result.
     * The listener keeps polling the dapp endpoint every `pollInterval` milliseconds
     * until it unsubscribes.
     * @param {number} pollInterval - The time in milliseconds between each poll.
     * @param {(result: any) => void} callback - The function to call when a new notice is received.
     * @return {() => void} - A function to unsubscribe from the listener created.
     * @throws {Error} - If there is no endpoint defined for the instance.
     */
    public addNoticesListener = (pollInterval: number, callback: (result: any) => void) => {
        if (!this.dappEndpoint) throw new Error('There is no endpoint defined for the instance');
        const client = new Client({
            url: `${this.dappEndpoint}/graphql`,
            requestPolicy: 'cache-and-network',
            exchanges: [
                cacheExchange,
                fetchExchange,
            ],
        })
        let cursor: string
        const timeout = setInterval(async () => {
            const result = await client.query(GET_NOTICES_QUERY, { cursor }).toPromise()
            if (!result.data.notices.pageInfo.hasNextPage && !result.data.notices.pageInfo.endCursor) return
            cursor = result.data.notices.pageInfo.endCursor;
            callback(decodeNotices(result.data.notices, this.dappABI));
        }, pollInterval)
        return () => clearInterval(timeout)
    }
}