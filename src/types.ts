import { gql } from "@urql/core";
import { Address, ParseAbi, parseAbi, encodeAbiParameters, parseAbiParameters } from 'viem';

encodeAbiParameters

export interface TikuaParams {
  abi: any
  provider?: any,
  appAddress?: Address,
  appEndpoint?: string,
  waitBlocks?: number,
  signerAddress?: Address,
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
  | 'CartesiDApp'
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
                    input {
                        index
                      	msgSender
                      	timestamp
                    }
                    payload
                }
            }
        }
    }`;

export const GET_NOTICE_FROM_INPUT_QUERY = gql`
query GetNoticeFromInput($inputIndex: Int!, $noticeIndex: Int!) {
  notice(inputIndex: $inputIndex, noticeIndex: $noticeIndex) {
    index
    input {
      index
      msgSender
      timestamp
    }
    payload
    proof {
      validity {
        inputIndexWithinEpoch
        outputIndexWithinInput
        outputHashesRootHash
        vouchersEpochRootHash
        noticesEpochRootHash
        machineStateHash
        outputHashInOutputHashesSiblings
        outputHashesInEpochSiblings
      }
      context
    }
  }
}
`;

export const GET_VOUCHERS_QUERY = gql`
query GetVouchers($cursor: String) {
  vouchers(first: 10, after: $cursor) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        index
        input {
          index
          msgSender
          timestamp
        }
        destination
        payload
        proof {
          validity {
            inputIndexWithinEpoch
            outputIndexWithinInput
            outputHashesRootHash
            vouchersEpochRootHash
            noticesEpochRootHash
            machineStateHash
            outputHashInOutputHashesSiblings
            outputHashesInEpochSiblings
          }
          context
        }
      }
    }
  }
}
`;

export const GET_VOUCHER_FROM_INPUT_QUERY = gql`
query GetVoucherFromInput($inputIndex: Int!, $voucherIndex: Int!) {
  voucher(inputIndex: $inputIndex, voucherIndex: $voucherIndex) {
    index
    input {
      index
      msgSender
      timestamp
    }
    destination
    payload
    proof {
      validity {
        inputIndexWithinEpoch
        outputIndexWithinInput
        outputHashesRootHash
        vouchersEpochRootHash
        noticesEpochRootHash
        machineStateHash
        outputHashInOutputHashesSiblings
        outputHashesInEpochSiblings
      }
      context
    }
  }
}
`;

export type Proof = {
  validity: {
    inputIndexWithinEpoch: number;
    outputIndexWithinInput: number;
    outputHashesRootHash: string;
    vouchersEpochRootHash: string;
    noticesEpochRootHash: string;
    machineStateHash: string;
    outputHashInOutputHashesSiblings: string[];
    outputHashesInEpochSiblings: string[];
  }
  context: string;
}

export type NoticesRawObject = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
  edges: {
    node: {
      index: number;
      input: {
        index: number;
        msgSender: Address;
        timestamp: number;
      };
      proof?: Proof;
      payload: string;
    };
  }[];
};

export type NoticeDecoded = {
  index: number;
  msgSender: Address;
  timestamp: Date;
  payload: any;
  proof?: Proof;
}

export type VouchersRawObject = {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
  edges: {
    node: {
      index: number;
      input: {
        index: number;
        msgSender: Address;
        timestamp: number;
      };
      destination: Address;
      payload: string;
      proof?: Proof;
    }
  }[];
};

export type VoucherDecoded = {
  index: number;
  msgSender: Address;
  timestamp: Date;
  destination: Address;
  payload: string;
  input: {
    index: number;
    msgSender: Address;
    timestamp: Date;
  };
  proof?: Proof;
  decodedPayloadFunction?: string
  decodedPayloadArgs?: any;
}

export type EtherDepositDecoded = {
  from: Address;
  amount: bigint;
  execLayerData: string;
}

export type ERC20DepositDecoded = {
  succeded: boolean;
  token: Address;
  from: Address;
  amount: bigint;
  execLayerData: `0x${string}`;
}

export type ERC721DepositDecoded = {
  token: Address,
  from: Address,
  tokenId: bigint,
  baseLayerData: `0x${string}`,
  execLayerData: `0x${string}`,
}

export type ERC1155SingleDepositDecoded = {
  token: Address,
  from: Address,
  tokenId: bigint,
  amount: bigint,
  baseLayerData: `0x${string}`,
  execLayerData: `0x${string}`,
}

export type ERC1155BatchDepositDecoded = {
  token: Address,
  from: Address,
  tokenIds: bigint[],
  amounts: bigint[],
  baseLayerData: `0x${string}`,
  execLayerData: `0x${string}`,
}

export const ApproveERC20ABI = parseAbi([
  "function approve(address spender, uint256 value)",
])

export const ApproveERC721ABI = parseAbi([
  "function approve(address to, uint256 tokenId)",
])

export const ApproveERC1155ABI = parseAbi([
  "function setApprovalForAll(address operator, bool approved)",
])