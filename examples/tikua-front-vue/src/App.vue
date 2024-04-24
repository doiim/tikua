<script setup lang="ts">
import { ref } from 'vue';
import { Tikua, Address } from '@doiim/tikua'

import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css';

// Add property to allow JSON to be serialized on the frontend
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

const ABI = [
  "struct Dragon { uint256 id; uint256 life; }",
  "function attackDragon(uint256 dragonId)",
  "function drinkPotion()",
  "function heroStatus(address player) returns (uint256)",
  "function dragonStatus(uint256 dragonId) returns (uint256)",
  "function dragonsList() returns (Dragon[])",
];

const walletAddress = ref<Address>();
const provider = ref()
const dragonIdInput = ref('')
const message = ref<any>({})

const connect = async () => {
  if (!window.ethereum) throw Error('MetaMask not found')
  await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x7A69', chainName: "Local Anvil", nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['http://localhost:8545'] }] });
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  if (!account) throw Error('MetaMask reject')
  walletAddress.value = account
  provider.value = window.ethereum
  await startSubscription()
}

const startSubscription = async () => {
  if (!provider.value || !walletAddress.value) throw Error('Wallet not connected')
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    abi: ABI
  })
  tikua.addMyNoticesListener(
    1000,
    walletAddress.value,
    (e) => message.value = e
  )
}

const drinkPotion = async () => {
  if (!walletAddress.value) return
  const tikua = new Tikua({
    provider: provider.value,
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    account: walletAddress.value,
    abi: ABI
  })
  await tikua.sendInput('drinkPotion', [])
}

const checkLife = async () => {
  if (!walletAddress.value) return
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    abi: ABI
  })
  const status = await tikua.fetchInspect('heroStatus', [walletAddress.value])
  message.value = {
    life: status
  }
}

const dragonsList = async () => {
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    abi: ABI
  })
  const status = await tikua.fetchInspect('dragonsList', []) as any[]
  message.value = status
}

const checkDragon = async () => {
  if (!dragonIdInput.value) return
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    abi: ABI
  })
  const status = await tikua.fetchInspect('dragonStatus', [dragonIdInput.value])
  message.value = {
    drago: dragonIdInput.value,
    status: status
  }
}

const attackDragon = async () => {
  if (!dragonIdInput.value) return
  const tikua = new Tikua({
    provider: provider.value,
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    account: walletAddress.value,
    abi: ABI
  })
  await tikua.sendInput('attackDragon', [dragonIdInput.value])
}

</script>

<template>
  <div class="text-stone-600">
    <img src="./assets/logo.png" width=200 height=200 />
    <div class="text-center">
      <h1 class="text-5xl font-semibold">Tikua</h1>
      <p>an isomorphic Cartesi SDK</p>
    </div>


    <div class="my-10">
      <button v-if="!walletAddress" @click="connect"
        class="bg-stone-100 rounded-lg p-2 px-4 font-semibold text-lg hover:outline hover:outline-1 hover:outline-blue-600">Connect
        Wallet</button>
      <p v-else>Wallet: <span class="text-orange-400">{{ walletAddress }}</span></p>
    </div>

    <p class="my-2">
      After connect your wallet successfully. Fill the form above.
    </p>

    <div class="bg-stone-50 rounded-lg p-4 flex flex-col gap-2 border border-stone-100 w-[600px] my-2">
      <h1 class="uppercase text-sm font-semibold text-stone-500">Hero</h1>
      <div class="flex gap-4">
        <button :disabled="!walletAddress" @click="checkLife"
          class="bg-stone-100 rounded-lg p-2 px-4  text-md hover:outline hover:outline-1 hover:outline-blue-600">Check
          Health</button>
        <button :disabled="!walletAddress" @click="drinkPotion"
          class="bg-stone-100 rounded-lg p-2 px-4  text-md hover:outline hover:outline-1 hover:outline-blue-600">Drink
          Potion</button>
      </div>
    </div>


    <form class="bg-stone-50 rounded-lg p-4 flex flex-col gap-2 border border-stone-100 w-[600px] my-2">
      <h1 class="uppercase text-sm font-semibold text-stone-500">Dragon</h1>
      <div>
        <button @click.prevent="dragonsList"
          class="bg-stone-100 rounded-lg p-2 px-4  text-md hover:outline hover:outline-1 hover:outline-blue-600">List
          All Dragons</button>
      </div>
      <div class="flex gap-4">
        <input v-model="dragonIdInput" placeholder="Enter a dragon ID"
          class="bg-white rounded-lg p-2 px-4  text-md focus:outline focus:outline-1 focus:outline-blue-600 w-40" />

        <button @click.prevent="checkDragon" v-if="dragonIdInput"
          class="bg-stone-100 rounded-lg p-2 px-4  text-md hover:outline hover:outline-1 hover:outline-blue-600">Check
          Health</button>
        <button @click.prevent="attackDragon" :disabled="!walletAddress" v-if="dragonIdInput"
          class="bg-stone-100 rounded-lg p-2 px-4  text-md hover:outline hover:outline-1 hover:outline-blue-600">Attack</button>

      </div>
    </form>

    <div class="self-start my-2">
      <VueJsonPretty :data="message" :show-icon="true" theme="dark" />
    </div>

  </div>
</template>
