import { createApp } from "@deroll/app";
import { decodeFunctionData, parseAbi, encodeFunctionData } from "viem";

// create application
const app = createApp({
  url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004",
});

// define application ABI
const abi = parseAbi([
  "function requestIncreaseCounter(address counterAddress)",
]);

const counterAbi = parseAbi([
  "function increment()",
]);

// handle input encoded as ABI function call
app.addAdvanceHandler(async ({ payload, metadata }) => {
  const { functionName, args } = decodeFunctionData({ abi, data: payload });

  switch (functionName) {
    case "requestIncreaseCounter":
      const [counterAddress] = args;
      app.createVoucher({
        destination: counterAddress,
        payload: encodeFunctionData({
          abi: counterAbi,
          functionName: "increment",
        })
      })
      return "accept";
  }
  return "reject";
});

app.start().catch(() => process.exit(1));
