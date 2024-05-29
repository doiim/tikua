import { createApp } from "@deroll/app";
import { decodeFunctionData, parseAbi, encodeFunctionData, decodeAbiParameters, parseAbiParameters, getAddress, fromHex, hexToBigInt } from "viem";

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
      // Decode Ether Deposit parameters returned from Portal + Execution Layer Data
      const regexEther = /^0x([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]*)$/;
      const slicesEther = payload.match(regexEther);
      if (!slicesEther) return "reject"
      const etherParams = {
        from: getAddress(`0x${slicesEther[1]}`),
        amount: BigInt(fromHex(`0x${slicesEther[2]}`, 'number')),
        // This execution Layer data could be used to send custom data
        execLayerData: `0x${slicesEther[3]}`
      }

      // Create a Voucher to return funds to the Sender.
      app.createVoucher({
        destination: dappAddress,
        payload: encodeFunctionData({
          abi: dappAbi,
          functionName: "withdrawEther",
          args: [etherParams.from, etherParams.amount]
        }),
      })
      return "accept";
    case "ERC20Portal":
      // Decode ERC20 Portal Deposit parameters returned from Portal + Execution Layer Data
      const regexERC20 = /^0x([0-9a-f]{2})([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]*)$/;
      console.log(payload)
      const slicesERC20 = payload.match(regexERC20);
      if (!slicesERC20) return "reject"
      const ERC20Params = {
        succeded: !!Number(`0x${slicesERC20[1]}`),
        token: getAddress(`0x${slicesERC20[2]}`),
        from: getAddress(`0x${slicesERC20[3]}`),
        amount: hexToBigInt(`0x${slicesERC20[4]}`),
        // This execution Layer data could be used to send custom data
        execLayerData: `0x${slicesERC20[5]}`
      }
      if (!ERC20Params.succeded) return "reject"
      // Create a Voucher to return funds to the Sender.
      app.createVoucher({
        destination: ERC20Params.token,
        payload: encodeFunctionData({
          abi: ERC20Abi,
          functionName: "transfer",
          args: [ERC20Params.from, ERC20Params.amount]
        }),
      })
      return "accept";

    case "ERC721Portal":
      // Decode ERC721 Portal Deposit parameters returned from Portal + Execution Layer Data
      const regexERC721 = /^0x([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]*)$/;
      console.log(payload)
      const slicesERC721 = payload.match(regexERC721);
      if (!slicesERC721) return "reject"
      const ERC721Params = {
        token: getAddress(`0x${slicesERC721[1]}`),
        from: getAddress(`0x${slicesERC721[2]}`),
        tokenId: hexToBigInt(`0x${slicesERC721[3]}`),
        // This execution Layer data could be used to send custom data
        data: decodeAbiParameters(
          [
            { name: 'baseLayerData', type: 'string' },
            { name: 'execLayerData', type: 'uint' },
          ],
          `0x${slicesERC721[4]}`
        )
      }
      // Create a Voucher to return NFT to the Sender.
      app.createVoucher({
        destination: ERC721Params.token,
        payload: encodeFunctionData({
          abi: ERC721Abi,
          functionName: "transferFrom",
          args: [dappAddress, ERC721Params.from, ERC721Params.tokenId]
        }),
      })
      return "accept";

    case "ERC1155SinglePortal":
      // Decode ERC1155 Single Portal Deposit parameters returned from Portal + Execution Layer Data
      const regexERC1155Single = /^0x([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]{64})([0-9a-f]{64})([0-9a-f]*)$/;
      console.log(payload)
      const slicesERC1155Single = payload.match(regexERC1155Single);
      if (!slicesERC1155Single) return "reject"
      const ERC1155SingleParams = {
        token: getAddress(`0x${slicesERC1155Single[1]}`),
        from: getAddress(`0x${slicesERC1155Single[2]}`),
        tokenId: hexToBigInt(`0x${slicesERC1155Single[3]}`),
        amount: hexToBigInt(`0x${slicesERC1155Single[4]}`),
        // This execution Layer data could be used to send custom data
        data: decodeAbiParameters(
          [
            { name: 'baseLayerData', type: 'string' },
            { name: 'execLayerData', type: 'uint' },
          ],
          `0x${slicesERC1155Single[5]}`
        )
      }
      // Create a Voucher to return NFTs to the Sender.
      app.createVoucher({
        destination: ERC1155SingleParams.token,
        payload: encodeFunctionData({
          abi: ERC1155SingleAbi,
          functionName: "safeTransferFrom",
          args: [dappAddress, ERC1155SingleParams.from, ERC1155SingleParams.tokenId, ERC1155SingleParams.amount, '0x']
        }),
      })
      return "accept";

    case "ERC1155BatchPortal":
      // Decode ERC1155 Batch Portal Deposit parameters returned from Portal + Execution Layer Data
      const regexERC1155Batch = /^0x([0-9a-f]{40})([0-9a-f]{40})([0-9a-f]*)$/;
      console.log(payload)
      const slicesERC1155Batch = payload.match(regexERC1155Batch);
      if (!slicesERC1155Batch) return "reject"
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
      const ERC1155BatchParams = {
        token: getAddress(`0x${slicesERC1155Batch[1]}`),
        from: getAddress(`0x${slicesERC1155Batch[2]}`),
        tokenIds,
        amounts,
        baseLayerData,
        execLayerData,
      }
      // Create a Voucher to return NFTs to the Sender.
      app.createVoucher({
        destination: ERC1155BatchParams.token,
        payload: encodeFunctionData({
          abi: ERC1155BatchAbi,
          functionName: "safeBatchTransferFrom",
          args: [
            dappAddress,
            ERC1155BatchParams.from,
            ERC1155BatchParams.tokenIds,
            ERC1155BatchParams.amounts,
            '0x'
          ]
        }),
      })
      return "accept";
  }
  return "reject";
});

app.start().catch(() => process.exit(1));
