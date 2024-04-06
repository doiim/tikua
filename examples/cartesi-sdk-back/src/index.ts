import { createApp } from "@deroll/app";
import { decodeFunctionData, parseAbi, Address, encodeErrorResult, encodeEventTopics, encodeFunctionResult, toHex, fromHex, hexToBytes, bytesToString, hexToString } from "viem";

// create application
const app = createApp({
  url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004",
});

const dragonList: number[] = new Array(100).fill(100)
const playersList: Map<Address, number> = new Map()

// define application ABI
const abi = parseAbi([
  "function attackDragon(uint256 dragonId) returns (uint256 dragonLife, uint256 playerLife)",
  "function drinkPotion()",
  "function heroStatus(address player) returns (uint256)",
  "function dragonStatus(uint256 dragonId) returns (uint256)",
]);

// handle input encoded as ABI function call
app.addAdvanceHandler(async ({ payload, metadata }) => {
  const { functionName, args } = decodeFunctionData({ abi, data: payload });

  switch (functionName) {
    case "attackDragon":
      const [dragonId] = args;
      console.log('Received Input Attack Dragon', dragonId, metadata.msg_sender)
      if (!playersList.has(metadata.msg_sender)) playersList.set(metadata.msg_sender, 100)
      playersList.set(metadata.msg_sender, Math.max(playersList.get(metadata.msg_sender)! - 30, 0))

      if (!dragonList[Number(dragonId)]) return 'reject'
      const dragonLife = dragonList[Number(dragonId)]
      dragonList[Number(dragonId)] = Math.max(dragonLife! - 10, 0)

      app.createNotice({ payload })
      return "accept";

    case "drinkPotion":
      console.log('Received Input Drink Potion', metadata.msg_sender)
      if (!playersList.has(metadata.msg_sender)) playersList.set(metadata.msg_sender, 100)
      playersList.set(metadata.msg_sender, Math.min(playersList.get(metadata.msg_sender)! + 50, 100))

      app.createNotice({ payload })
      return "accept";
  }
  return "reject";
});

app.addInspectHandler(async ({ payload }) => {
  console.log(hexToString(payload))
  const { functionName, args } = decodeFunctionData({ abi, data: hexToString(payload) as `0x${string}` });

  switch (functionName) {
    case "heroStatus":
      const [player] = args;
      const heroLife = encodeFunctionResult({
        abi,
        functionName: "heroStatus",
        result: BigInt(playersList.get(player) || 0)
      })
      app.createReport({ payload: heroLife })
      return;
    case "dragonStatus":
      const [dragonId] = args;
      const dragonLife = encodeFunctionResult({
        abi,
        functionName: "dragonStatus",
        result: BigInt(dragonList[Number(dragonId)] || 0)
      })
      app.createReport({ payload: dragonLife })
      return;
  }
})

app.start().catch(() => process.exit(1));
