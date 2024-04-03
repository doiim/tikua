import { gql } from "@urql/core";
import { Address } from 'viem';

export interface SDKParams {
    provider: any,
    address: Address,
    endpoint?: string,
    abi?: any
    waitBlocks?: number,
    account?: Address,
}

export enum chainsByName {
    'arbitrum' = 42161,
    'arbitrum_goerli' = 421613,
    'arbitrum_sepolia' = 421614,
    'mainnet' = 1,
    'optimism' = 10,
    'optimism_goerli' = 420,
    'optimism_sepolia' = 11155420,
    'sepolia' = 11155111,
    'foundry' = 31337
}

export type ChainName = keyof typeof namesByChain;

export const namesByChain = {
    '0xa4b1': 'arbitrum',
    '0x66ed': 'arbitrum_goerli',
    '0x66ee': 'arbitrum_sepolia',
    '0x1': 'mainnet',
    '0xa': 'optimism',
    '0x1a4': 'optimism_goerli',
    '0xaa37dc': 'optimism_sepolia',
    '0xaa36a7': 'sepolia',
    '0x7a69': 'foundry',
}

export type ContractName =
    | 'AuthorityFactory'
    | 'CartesiDAppFactory'
    | 'DAppAddressRelay'
    | 'ERC20Portal'
    | 'ERC721Portal'
    | 'ERC1155BatchPortal'
    | 'ERC1155SinglePortal'
    | 'EtherPortal'
    | 'HistoryFactory'
    | 'InputBox'
    ;

// GRAPHQL QUERIES

// GraphQL query to retrieve notices given a cursor
export const GET_NOTICES_QUERY = gql`
query GetNotices($cursor: String) {
    notices(first: 10, after: $cursor) {
        totalCount
        pageInfo {
            hasNextPage
            endCursor
        }
        edges {
            node {
                index
                payload
            }
        }
    }
}`;