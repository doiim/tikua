import { createApp } from "@deroll/app";
import {
  parseAbi,
  encodeFunctionData,
  getAddress
} from "viem";
import {
  decodeERC1155BatchDeposit,
  decodeERC1155SingleDeposit,
  decodeERC20Deposit,
  decodeERC721Deposit,
  decodeEtherDeposit
} from "@doiim/tikua"

const PortalAddresses: { [key: string]: string } = {
  "0xedB53860A6B52bbb7561Ad596416ee9965B055Aa": "ERC1155BatchPortal",
  "0x7CFB0193Ca87eB6e48056885E026552c3A941FC4": "ERC1155SinglePortal",
  "0x9C21AEb2093C32DDbC53eEF24B873BDCd1aDa1DB": "ERC20Portal",
  "0x237F8DD094C0e47f4236f12b4Fa01d6Dae89fb87": "ERC721Portal",
  "0xFfdbe43d4c855BF7e0f105c400A50857f53AB044": "EtherPortal",
}

const dappAddress = "0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e";

// create application
const app = createApp({
  url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004",
});

// define application ABI
const abi = parseAbi([
  "function requestIncreaseCounter(address counterAddress)",
]);

const dappAbi = parseAbi([
  "function withdrawEther(address, uint256)",
]);

const ERC20Abi = parseAbi([
  "function transfer(address, uint256)",
]);

const ERC721Abi = parseAbi([
  "function transferFrom(address, address, uint256)",
]);

const ERC1155SingleAbi = parseAbi([
  "function safeTransferFrom(address,address,uint256,uint256,bytes)",
]);

const ERC1155BatchAbi = parseAbi([
  "function safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
]);

// handle input encoded as ABI function call
app.addAdvanceHandler(async ({ payload, metadata }) => {
  // const { functionName, args } = decodeFunctionData({ abi, data: payload });
  switch (PortalAddresses[getAddress(metadata.msg_sender)]) {
    case "EtherPortal":
      const EtherDecoded = decodeEtherDeposit(payload)
      // Create a Voucher to return funds to the Sender.
      app.createVoucher({
        destination: dappAddress,
        payload: encodeFunctionData({
          abi: dappAbi,
          functionName: "withdrawEther",
          args: [EtherDecoded.from, EtherDecoded.amount]
        }),
      })
      return "accept";
    case "ERC20Portal":
      const ERC20Decoded = decodeERC20Deposit(payload)
      if (!ERC20Decoded.succeded) return "reject"
      // Create a Voucher to return funds to the Sender.
      app.createVoucher({
        destination: ERC20Decoded.token,
        payload: encodeFunctionData({
          abi: ERC20Abi,
          functionName: "transfer",
          args: [ERC20Decoded.from, ERC20Decoded.amount]
        }),
      })
      return "accept";

    case "ERC721Portal":
      const ERC721Decoded = await decodeERC721Deposit(payload)
      // Create a Voucher to return NFT to the Sender.
      app.createVoucher({
        destination: ERC721Decoded.token,
        payload: encodeFunctionData({
          abi: ERC721Abi,
          functionName: "transferFrom",
          args: [dappAddress, ERC721Decoded.from, ERC721Decoded.tokenId]
        }),
      })
      return "accept";

    case "ERC1155SinglePortal":
      const ERC1155SingleDecoded = await decodeERC1155SingleDeposit(payload)
      // Create a Voucher to return NFTs to the Sender.
      app.createVoucher({
        destination: ERC1155SingleDecoded.token,
        payload: encodeFunctionData({
          abi: ERC1155SingleAbi,
          functionName: "safeTransferFrom",
          args: [
            dappAddress,
            ERC1155SingleDecoded.from,
            ERC1155SingleDecoded.tokenId,
            ERC1155SingleDecoded.amount,
            '0x']
        }),
      })
      return "accept";

    case "ERC1155BatchPortal":
      const ERC1155BatchDecoded = await decodeERC1155BatchDeposit(payload)
      // Create a Voucher to return NFTs to the Sender.
      app.createVoucher({
        destination: ERC1155BatchDecoded.token,
        payload: encodeFunctionData({
          abi: ERC1155BatchAbi,
          functionName: "safeBatchTransferFrom",
          args: [
            dappAddress,
            ERC1155BatchDecoded.from,
            ERC1155BatchDecoded.tokenIds,
            ERC1155BatchDecoded.amounts,
            '0x'
          ]
        }),
      })
      return "accept";
  }
  return "reject";
});

app.start().catch(() => process.exit(1));
