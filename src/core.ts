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
    Chain,
    PublicClient,
    WalletClient,
    decodeEventLog,
    decodeFunctionData
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
} from "@urql/core"
import { decodeNotices, decodeVouchers, getCartesiContractAbi, getCartesiDeploymentAddress, getContractNameFromAddress } from './utils.js';
import {
    ApproveERC1155ABI,
    ApproveERC20ABI,
    ApproveERC721ABI,
    DecodedInput,
    DecodedLog,
    DecodedTransactionReceipt,
    GET_NOTICES_QUERY,
    GET_NOTICE_FROM_INPUT_QUERY,
    GET_VOUCHERS_QUERY,
    GET_VOUCHER_FROM_INPUT_QUERY,
    NoticesRawObject,
    Proof,
    TikuaParams,
    VoucherDecoded
} from './types.js';

export class Tikua {
    private readonly provider!: EIP1193Provider;
    private readonly appAddress!: Address;
    private readonly appEndpoint!: string;
    private readonly dappABI: Abi;
    private readonly waitBlocks: number = 1;
    private readonly signerAddress?: string;
    private timers: number[] = [];

    private chain?: Chain;

    /**
     * Constructor for initializing the SDK with the provided parameters.
     *
     * @param {string} abi -  The ABI for the dapp
     * @param {EIP1193Provider} provider - (optional) The provider for the SDK used for send Inputs
     * @param {string} dappAddress - (optional) The address for the dapp used for Inspect and Notices
     * @param {string} dappEndpoint - (optional) The endpoint for the dapp used for Inspect and Notices
     * @param {number} waitBlocks - (optional) The number of confirmation blocks after send inputs
     * @param {string} signerAddress - (optional) The connected account to send the inputs using SDK
     */
    public constructor({ provider, appAddress, appEndpoint, abi, waitBlocks, signerAddress }: TikuaParams) {
        if (abi) this.dappABI = parseAbi(abi);
        else throw Error('Application ABI needs to be provided to initialize the Tikua SDK');
        if (provider) this.provider = provider as EIP1193Provider;
        if (appAddress) this.appAddress = appAddress;
        if (appEndpoint) this.appEndpoint = appEndpoint;
        if (waitBlocks) this.waitBlocks = waitBlocks;
        if (signerAddress) this.signerAddress = signerAddress
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
        return this.appAddress;
    }

    /**
     * Prepares the sender by initializing the necessary clients and retrieving the signer account.
     * @returns A promise that resolves to an object containing the initialized public client, the account address,
     * the wallet client, and the chain information.
     * @throws {Error} If the chain is not assigned, the application address is not provided, or no signer account
     * could be determined.
     */
    private async prepareSender(): Promise<{
        publicClient: PublicClient,
        account: Address,
        client: WalletClient
        chain: Chain
    }> {
        if (!this.chain) await this.assignChain();
        if (!this.chain) throw new Error('Chain ID not found in selected provider');
        if (!this.appAddress) throw new Error('Application address (appAddress) not found in Tikua instance');
        const client = createWalletClient({
            chain: this.chain,
            transport: custom(this.provider)
        })
        const account = this.signerAddress as Address || (await client.getAddresses()).shift()
        if (!account) throw new Error('Not able to grab an signer account from provider');

        const publicClient = createPublicClient({
            transport: custom(this.provider)
        })

        return {
            publicClient,
            account,
            client,
            chain: this.chain
        }
    }

    /**
     * Prepares and returns a GraphQL client configured for interacting with the dapp's GraphQL API.
     * @throws {Error} Throws an error if the application endpoint is not defined in the Tikua instance.
     * @returns {Client} A configured instance of the GraphQL `Client` ready for querying the dapp's GraphQL API.
     */
    private prepareGraphQLClient(): Client {
        if (!this.appEndpoint) throw new Error('Application endpoint not defined on Tikua, please pass a valid endpoint on constructor.');
        return new Client({
            url: `${this.appEndpoint}/graphql`,
            requestPolicy: 'cache-and-network',
            exchanges: [
                cacheExchange,
                fetchExchange,
            ],
        })
    }

    /**
     * Assigns the chain based on the provider.
     * @return {Promise<void>} Promise that resolves when the chain is assigned.
     */
    private assignChain = async () => {
        if (!this.provider) throw new Error('Provider not defined on Tikua, please pass a valid provider on constructor.');
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
        const { publicClient, account, client, chain } = await this.prepareSender();
        // Grab Input Box address from Cartesi on a specific chain.
        const inputBoxAddress = await getCartesiDeploymentAddress(chain.id, 'InputBox')
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
            args: [this.appAddress, data],
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
        if (!this.appEndpoint) throw new Error('Application endpoint not defined on Tikua, please pass a valid endpoint on constructor.');

        const payloadRequest = encodeFunctionData({
            abi: this.dappABI,
            functionName: fn,
            args
        })
        const response = await fetch(`${this.appEndpoint}/inspect/${payloadRequest}`);
        const data = await response.json() as { reports: any[] };
        return decodeFunctionResult({
            abi: this.dappABI,
            functionName: fn,
            data: data.reports.shift().payload
        })
    }

    /**
     * Adds a listener for notices and calls the provided callback with the result.
     * The listener keeps polling the dapp endpoint every `pollInterval` milliseconds
     * until it unsubscribes. The callback is called with the decoded notices.
     *
     * @param {TypedDocumentNode} query - The GraphQL query to subscribe to.
     * @param {any} filter - The filter to apply to the query.
     * @param {any} filter - The filter to apply to the query.
     * @param {any} filter - The filter to apply to the query.
     **/
    private addListenerNotices = (query: TypedDocumentNode<any, AnyVariables>, filter: any, pollInterval: number, callback: (result: any) => void) => {
        const client = this.prepareGraphQLClient();
        let cursor: string
        const timeout = setInterval(async () => {
            const result = await client.query(query, { cursor, ...filter }).toPromise()
            if (!result.data.notices.pageInfo.hasNextPage && !result.data.notices.pageInfo.endCursor) return
            cursor = result.data.notices.pageInfo.endCursor;
            if (result.data.notices.edges.length > 0)
                callback(decodeNotices(result.data.notices, this.dappABI));
        }, pollInterval)
        return () => clearInterval(timeout)
    }

    /**
     * Fetches a notice from the GraphQL API based on the provided query and filter.
     *
     * @param query - The GraphQL query to fetch notices.
     * @param filter - The filter to apply when fetching notices.
     * @returns {Promise<Notice[]>} - A promise that resolves to an array of notices fetched from the GraphQL API.
     * @throws {Error} - If the application endpoint is not defined on Tikua, throws an error.
     * @throws {Error} - If the GraphQL query or filter are invalid, throws an error.
     */
    private fetchNotice = async (query: TypedDocumentNode<any, AnyVariables>, filter: any) => {
        const client = this.prepareGraphQLClient();
        const result = await client.query(query, filter).toPromise()
        if (!result.data) throw new Error('Could not fetch notice from filter passed.');
        return decodeNotices({
            totalCount: 1,
            pageInfo: {
                hasNextPage: false,
                endCursor: ''
            },
            edges: [{ node: result.data.notice }]
        }, this.dappABI);
    }

    /**
     * Adds a listener for vouchers. Fetches vouchers from the GraphQL API and calls the provided callback function for each voucher.
     * @param query - The GraphQL query to fetch vouchers.
     * @param filter - The filter to apply when fetching vouchers.
     * @param pollInterval - The interval at which to poll for new vouchers.
     * @param callback - The callback function to be called for each voucher fetched.
     * @returns {Function} - A function that can be called to stop listening for vouchers.
     */
    private addListenerVouchers = (query: TypedDocumentNode<any, AnyVariables>, filter: any, pollInterval: number, callback: (result: VoucherDecoded[]) => void) => {
        const client = this.prepareGraphQLClient();
        let cursor: string
        const timeout = setInterval(async () => {
            const result = await client.query(query, { cursor, ...filter }).toPromise()
            if (!result.data.vouchers.pageInfo.hasNextPage && !result.data.vouchers.pageInfo.endCursor) return
            cursor = result.data.vouchers.pageInfo.endCursor;
            // Call the callback
            if (result.data.vouchers.edges.length > 0)
                callback(decodeVouchers(result.data.vouchers, this.dappABI));
        }, pollInterval)
        return () => clearInterval(timeout)
    }

    /**
     * Fetches a voucher from the GraphQL API based on the provided query and filter.
     * @param query - The GraphQL query to fetch vouchers.
     * @param filter - The filter to apply when fetching vouchers.
     * @returns {Promise<Voucher[]>} - A promise that resolves to an array of vouchers fetched from the GraphQL API.
     * @throws {Error} - If the application endpoint is not defined on Tikua, throws an error.
     */
    private fetchVoucher = async (query: TypedDocumentNode<any, AnyVariables>, filter: any) => {
        const client = this.prepareGraphQLClient();
        const result = await client.query(query, filter).toPromise()
        if (!result.data) throw new Error('Could not fetch voucher from filter passed.');
        return decodeVouchers({
            totalCount: 1,
            pageInfo: {
                hasNextPage: false,
                endCursor: ''
            },
            edges: [{ node: result.data.voucher }]
        }, this.dappABI);
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
        return this.addListenerNotices(GET_NOTICES_QUERY, {}, pollInterval, callback)
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
    public addMyNoticesListener = (pollInterval: number, account: Address, callback: (result: any) => void) => {
        return this.addListenerNotices(GET_NOTICES_QUERY, { account: account.toLowerCase() }, pollInterval, callback)
    }

    /**
     * Fetches a notice from a specific input index and notice index.
     * @param inputIndex - The index of the input from which to fetch notices.
     * @param noticeIndex - The index of the notice inside the input from which to fetch.
     * @returns {Promise<Notice[]>} - A promise that resolves to an array of notices fetched from the specified input index and notice index.
     * @throws {Error} - If the application endpoint is not defined on Tikua, throws an error.
     * @throws {Error} - If the Cartesi Dapp address or ABI is not found for the selected network.
     * @throws {Error} - If the Input Box address or ABI is not found for the selected network.
    */
    public fetchNoticeFromInput = async (inputIndex: number, noticeIndex: number) => {
        return await this.fetchNotice(GET_NOTICE_FROM_INPUT_QUERY, { inputIndex, noticeIndex })
    }

    /**
     * Executes a voucher on the Cartesi DApp.
     * @param voucher - The voucher to execute.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated execution transaction.
     * @throws {Error} - If the Cartesi DApp address or ABI is not found for the selected network.
     * @throws {Error} - If the Voucher currently has no proof yet.
     */
    public executeVoucher = async (voucher: VoucherDecoded) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab the Cartesi Dapp address
        const appAbi = await getCartesiContractAbi('CartesiDApp')
        if (!appAbi) throw new Error('Cartesi Dapp ABI not found');

        // Grab the Cartesi Dapp address
        if (!voucher.proof) throw new Error('Proof not found for the Voucher provided.');

        // Simulate "executeVoucher" transaction
        const { request } = await publicClient.simulateContract({
            address: this.appAddress,
            abi: appAbi,
            functionName: 'executeVoucher',
            args: [voucher.destination, voucher.payload, voucher.proof],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Checks if a voucher has been executed on the Cartesi DApp.
     * @param voucher - The voucher to check.
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the voucher has been executed.
     * @throws {Error} - If the Cartesi DApp address or ABI is not found for the selected network.
     * @throws {Error} - If the voucher does not have a proof yet, indicating that it has not been executed yet.
    */
    public checkVoucher = async (voucher: VoucherDecoded) => {
        if (!voucher.proof) throw new Error('This Voucher has no proof yet, wait for the epoch.');
        const { publicClient, account } = await this.prepareSender();

        // Grab the Cartesi Dapp address
        const appAbi = await getCartesiContractAbi('CartesiDApp')
        if (!appAbi) throw new Error('Cartesi Dapp ABI not found');

        return await publicClient.readContract({
            address: this.appAddress,
            abi: appAbi,
            functionName: 'wasVoucherExecuted',
            args: [voucher.input.index, voucher.proof.validity.inputIndexWithinEpoch],
            account
        })
    }

    /**
     * Fetches a voucher from a specific input index.
     * @param inputIndex - The index of the input from which to fetch vouchers.
     * @param voucherIndex - The index of the voucher inside input from which to fetch.
     * @returns {Promise<Voucher[]>} - A promise that resolves to an array of vouchers fetched from the specified input index.
     * @throws {Error} - If the Cartesi Dapp address or ABI is not found for the selected network.
     * @throws {Error} - If the Input Box address or ABI is not found for the selected network.
     */
    public fetchVoucherFromInput = async (inputIndex: number, voucherIndex: number) => {
        return await this.fetchVoucher(GET_VOUCHER_FROM_INPUT_QUERY, { inputIndex, voucherIndex })
    }

    /**
     * Adds a listener for vouchers. Fetches vouchers from the GraphQL API and calls the provided callback function for each voucher.
     * @param pollInterval - The interval at which to poll for new vouchers.
     * @param callback - The callback function to be called for each voucher fetched.
     * @returns {Function} - A function that can be called to stop listening for vouchers.
     */
    public addVouchersListener = (pollInterval: number, callback: (result: any) => void) => {
        return this.addListenerVouchers(GET_VOUCHERS_QUERY, {}, pollInterval, callback)
    }

    /**
     * Adds a listener for vouchers owned by a specific account.
     * Fetches vouchers from the GraphQL API and calls the provided callback function for each voucher.
     * @param pollInterval - The interval at which to poll for new vouchers.
     * @param account - The account address for which to listen for vouchers.
     * @param callback - The callback function to be called for each voucher fetched.
     * @returns {Function} - A function that can be called to stop listening for vouchers.
     */
    public addMyVouchersListener = (pollInterval: number, account: Address, callback: (result: any) => void) => {
        return this.addListenerVouchers(GET_VOUCHERS_QUERY, { account: account.toLowerCase() }, pollInterval, callback)
    }

    /**
     * Deposits Ether on the Ether Portal.
     * @param amount - The amount of Ether to deposit.
     * @param execLayerData - The execution layer data for the deposit.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated deposit transaction.
     * @throws {Error} - If the Ether Portal address or ABI is not found for the selected network.
     */
    public depositEther = async (amount: bigint, execLayerData: string) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab Ether portal address from Cartesi on a specific chain.
        const etherPortalAddress = await getCartesiDeploymentAddress(chain.id, 'EtherPortal')
        if (!etherPortalAddress) throw new Error('Ether Portal not found for the selected network');

        const etherPortalAbi = await getCartesiContractAbi('EtherPortal')
        if (!etherPortalAbi) throw new Error('Application ABI not found');

        // Simulate "depositEther" transaction
        const { request } = await publicClient.simulateContract({
            address: etherPortalAddress,
            abi: etherPortalAbi,
            functionName: 'depositEther',
            args: [this.appAddress, execLayerData],
            value: amount,
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Approves ERC20 tokens for deposit on the ERC20 Portal.
     * @param token - The address of the ERC20 token.
     * @param amount - The amount of ERC20 tokens to approve.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated approval transaction.
     * @throws {Error} - If the ERC20 Portal address or ABI is not found for the selected network.
     */
    public approveERC20 = async (token: Address, amount: bigint) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab ERC20 Portal address from Cartesi on a specific chain.
        const ERC20PortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC20Portal')
        if (!ERC20PortalAddress) throw new Error('ERC20 Portal not found for the selected network');

        // Simulate "approve" transaction
        const { request } = await publicClient.simulateContract({
            address: token,
            abi: ApproveERC20ABI,
            functionName: 'approve',
            args: [ERC20PortalAddress, amount],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Deposits ERC20 tokens on the ERC20 Portal.
     * @param token - The address of the ERC20 token.
     * @param amount - The amount of ERC20 tokens to deposit.
     * @param execLayerData - (Optional) Execution layer data for the deposit.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated deposit transaction.
     * @throws {Error} - If the ERC20 Portal address or ABI is not found for the selected network.
     */
    public depositERC20 = async (token: Address, amount: bigint, execLayerData: string) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab ERC20 Portal address from Cartesi on a specific chain.
        const ERC20PortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC20Portal')
        if (!ERC20PortalAddress) throw new Error('ERC20Portal not found for the selected network');

        const ERC20PortalAbi = await getCartesiContractAbi('ERC20Portal')
        if (!ERC20PortalAbi) throw new Error('ERC20Portal ABI not found for the selected network');

        const { request } = await publicClient.simulateContract({
            address: ERC20PortalAddress,
            abi: ERC20PortalAbi,
            functionName: 'depositERC20Tokens',
            args: [token, this.appAddress, amount, execLayerData],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Approve an ERC721 token before deposit it on the ERC721 Portal
     * @param {Address} token Address of the ERC721 token.
     * @param {bigint} tokenId Id of the ERC721 token.
     * @returns {string} Transaction hash of the simulated approve transaction.
     */
    public approveERC721 = async (token: Address, tokenId: bigint) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab Input Box address from Cartesi on a specific chain.
        const ERC721PortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC721Portal')
        if (!ERC721PortalAddress) throw new Error('ERC20 Portal not found for the selected network');

        const { request } = await publicClient.simulateContract({
            address: token,
            abi: ApproveERC721ABI,
            functionName: 'approve',
            args: [ERC721PortalAddress, tokenId],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Deposits an ERC721 token on the ERC721 Portal.
     * @param token - The address of the ERC721 token.
     * @param tokenId - The ID of the ERC721 token to deposit.
     * @param baseLayerData - (Optional) Base layer data for the deposit.
     * @param execLayerData - (Optional) Execution layer data for the deposit.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated deposit transaction.
     * @throws {Error} - If the ERC721 Portal address or ABI is not found for the selected network.
     */
    public depositERC721 = async (
        token: Address,
        tokenId: bigint,
        baseLayerData: string = '',
        execLayerData: string = ''
    ) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab ERC721 Portal address and ABI from Cartesi on a specific chain.
        const ERC721PortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC721Portal')
        if (!ERC721PortalAddress) throw new Error('ERC20 Portal not found for the selected network');

        const ERC721PortalAbi = await getCartesiContractAbi('ERC721Portal')
        if (!ERC721PortalAbi) throw new Error('Input Box ABI not found for the selected network');

        // Simulate "depositERC721Token" transaction
        const { request } = await publicClient.simulateContract({
            address: ERC721PortalAddress,
            abi: ERC721PortalAbi,
            functionName: 'depositERC721Token',
            args: [token, this.appAddress, tokenId, baseLayerData, execLayerData],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Approve ERC1155 tokens to be send to the ERC1155 portal.
     * This function will approve the portal to spend all tokens of this type.
     * @param token - Address of the ERC1155 token.
     * @param multi - Whether to set approval for the Batch Portal. If true, set approval for the Batch Portal.
     * @param approve - Whether to set approval or revoke approval. Default is true (approve).
     * @returns {Promise<string>} - Transaction hash of the simulated approval transaction.
     * @throws {Error} - If the ERC1155 Single Portal address or ABI is not found for the selected network.
     * @throws {Error} - If the ERC1155 Batch Portal address or ABI is not found for the selected network.
     */
    private approveERC1155 = async (token: Address, multi: boolean, approve: boolean) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        const ERC1155SinglePortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC1155SinglePortal')
        if (!ERC1155SinglePortalAddress) throw new Error('ERC1155 Single Portal not found for the selected network');

        const ERC1155BatchPortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC1155BatchPortal')
        if (!ERC1155BatchPortalAddress) throw new Error('ERC1155 Multi Portal not found for the selected network');

        // Simulate "setApprovalForAll" transaction
        const { request } = await publicClient.simulateContract({
            address: token,
            abi: ApproveERC1155ABI,
            functionName: 'setApprovalForAll',
            args: [multi ? ERC1155BatchPortalAddress : ERC1155SinglePortalAddress, true],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * This is used to set approval for the ERC1155 Single Portal contract transfer your tokens.
     * @param token Address of the ERC1155 token
     * @param multi Whether to set approval for the Single Portal
     * @param approve Whether to set approval or revoke approval
     * @returns txHash of the simulated transaction
     */
    public approveSingleERC1155 = async (token: Address, approve: boolean = true) => {
        return await this.approveERC1155(token, false, approve);
    }

    /**
     * Approve ERC1155 tokens to be send to ERC1155 Batch Portal.
     * This function will approve the portal to spend all tokens of this type.
     * @param token - Address of ERC1155 token.
     * @param approve - Whether to set approval or revoke approval. Default is true (approve).
     * @returns {Promise<string>} - Transaction hash of the simulated approval transaction.
     * @throws {Error} - If the ERC1155 Batch Portal address or ABI is not found for the selected network.
     */
    public approveBatchERC1155 = async (token: Address, approve: boolean = true) => {
        return await this.approveERC1155(token, true, approve);
    }

    /**
     * Deposits a single ERC1155 token on the ERC1155 Single Portal.
     * @param token - The address of the ERC1155 token.
     * @param tokenId - The ID of the ERC1155 token to deposit.
     * @param amount - The amount of the ERC1155 token to deposit.
     * @param baseLayerData - (Optional) Base layer data for the deposit.
     * @param execLayerData - (Optional) Execution layer data for the deposit.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated deposit transaction.
     * @throws {Error} - If the ERC1155 Single Portal address or ABI is not found for the selected network.
     */
    public depositSingleERC1155 = async (
        token: Address,
        tokenId: bigint,
        amount: bigint,
        baseLayerData: string = '',
        execLayerData: string = ''
    ) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab ERC1155 address and ABI from Cartesi on a specific chain.
        const ERC1155SinglePortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC1155SinglePortal')
        if (!ERC1155SinglePortalAddress) throw new Error('ERC1155 Single Portal not found for the selected network');

        const ERC1155SinglePortalAbi = await getCartesiContractAbi('ERC1155SinglePortal')
        if (!ERC1155SinglePortalAbi) throw new Error('Input Box ABI not found for the selected network');

        // Simulate "depositSingleERC1155Token" transaction
        const { request } = await publicClient.simulateContract({
            address: ERC1155SinglePortalAddress,
            abi: ERC1155SinglePortalAbi,
            functionName: 'depositSingleERC1155Token',
            args: [token, this.appAddress, tokenId, amount, baseLayerData, execLayerData],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Deposits a batch of ERC1155 tokens on the ERC1155 Batch Portal.
     * @param token - The address of the ERC1155 token.
     * @param tokenIds - An array of token IDs to deposit.
     * @param amounts - An array of amounts corresponding to each token ID.
     * @param baseLayerData - (Optional) Base layer data for the deposit.
     * @param execLayerData - (Optional) Execution layer data for the deposit.
     * @returns {Promise<string>} - A promise that resolves to the transaction hash of the simulated deposit transaction.
     * @throws {Error} - If the ERC1155 Batch Portal address or ABI is not found for the selected network.
     */
    public depositBatchERC1155 = async (
        token: Address,
        tokenIds: bigint[],
        amounts: bigint[],
        baseLayerData: string = '',
        execLayerData: string = ''
    ) => {
        const { publicClient, account, client, chain } = await this.prepareSender();

        // Grab ERC1155 Batch Portal address and ABI from Cartesi on a specific chain.
        const ERC1155BatchPortalAddress = await getCartesiDeploymentAddress(chain.id, 'ERC1155BatchPortal')
        if (!ERC1155BatchPortalAddress) throw new Error('ERC1155 Batch Portal not found for the selected network');

        const ERC1155BatchPortalAbi = await getCartesiContractAbi('ERC1155BatchPortal')
        if (!ERC1155BatchPortalAbi) throw new Error('ERC1155 Batch Portal ABI not found for the selected network');

        // Simulate "depositBatchERC1155Token" transaction
        const { request } = await publicClient.simulateContract({
            address: ERC1155BatchPortalAddress,
            abi: ERC1155BatchPortalAbi,
            functionName: 'depositBatchERC1155Token',
            args: [token, this.appAddress, tokenIds, amounts, baseLayerData, execLayerData],
            account
        })

        const txHash = await client.writeContract(request)
        return txHash;
    }

    /**
     * Monitor a transaction hash and return the transaction receipt with decoded logs and inputs.
     * @dev If you want to be able to decode events and function from different contracts, try adding to custom ABI.
     * @param hash - The transaction hash that you want to monitor.
     * @param confirmations - (Optional) The amount of confirmation blocks before returning. Default to 0.
     * @param customABI - (Optional) The custom ABI to decode inputs and logs from receipt.
     * @returns {Promise<DecodedTransactionReceipt>} - A promise that resolves to the transaction receipt of the given transaction hash.
     * @throws {Error} - If the transaction hash isn't found.
     */
    public getTransactionReceiptByHash = async (
        hash: `0x${string}`,
        confirmations: number = 0,
        customABI?: Abi
    ) => {

        const { publicClient, chain } = await this.prepareSender();
        // Get transaction receipt for completion data
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations
        })
        // Get transaction for decode input
        const transaction = await publicClient.getTransaction({
            hash
        })
        if (!receipt) throw new Error(`Transaction receipt not found for hash ${hash}`);
        if (receipt.to) {
            const contractName = await getContractNameFromAddress(chain.id, receipt.to)
            let contractAbi: Abi = this.dappABI;
            if (contractName) contractAbi = await getCartesiContractAbi(contractName)
            const decodedLogs = receipt.logs.map(log => {
                try {
                    const evt = decodeEventLog({
                        abi: customABI || contractAbi,
                        data: log.data,
                        topics: log.topics
                    }) as DecodedLog
                    return evt;
                } catch (e) {
                    return undefined;
                }
            })
            let decodedInput: DecodedInput | undefined = undefined;
            try {
                decodedInput = decodeFunctionData({
                    abi: customABI || contractAbi,
                    data: transaction.input
                })
            } catch { }
            return {
                ...receipt,
                decodedLogs,
                decodedInput
            } as DecodedTransactionReceipt
        }
        return receipt as DecodedTransactionReceipt
    }
}

