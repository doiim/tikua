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
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isLoading = ref(false)

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
    (e) => {
      console.log('New event', e)
      message.value = e
    }
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
  isLoading.value = true
  try {
    await tikua.sendInput('drinkPotion', [])
  } catch (e) {
    // console.error(e)
  }
  isLoading.value = false
}

const checkLife = async () => {
  if (!walletAddress.value) return
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    abi: ABI
  })
  isLoading.value = true
  const status = await tikua.fetchInspect('heroStatus', [walletAddress.value])
  message.value = {
    life: status
  }
  isLoading.value = false
}

const dragonsList = async () => {
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    abi: ABI
  })
  isLoading.value = true
  const status = await tikua.fetchInspect('dragonsList', []) as any[]
  message.value = status
  isLoading.value = false
}

const checkDragon = async () => {
  if (!dragonIdInput.value) return
  const tikua = new Tikua({
    provider: provider.value,
    endpoint: 'http://localhost:8080',
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    abi: ABI
  })
  isLoading.value = true
  const status = await tikua.fetchInspect('dragonStatus', [dragonIdInput.value])
  message.value = {
    drago: dragonIdInput.value,
    status: status
  }
  isLoading.value = false
}

const attackDragon = async () => {
  if (!dragonIdInput.value) return
  const tikua = new Tikua({
    provider: provider.value,
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    account: walletAddress.value,
    abi: ABI
  })
  isLoading.value = true
  try {
    await tikua.sendInput('attackDragon', [dragonIdInput.value])
  } catch (e) {
    // console.error(e)
  }
  isLoading.value = false
}

</script>

<template>
  <div class="text-stone-600 dark:text-stone-300  overflow-hidden">
    <img src="./assets/logo.png" width=200 height=200 class="mx-auto" />
    <div class="text-center">
      <h1 class="text-5xl font-semibold">Tikua</h1>
      <p>an isomorphic Cartesi SDK</p>
    </div>


    <div class="my-16 text-center">
      <button v-if="!walletAddress" @click="connect"
        class="bg-stone-100 dark:bg-stone-800 rounded-lg p-4 px-6 font-semibold text-xl outline outline-slate-200 hover:outline-1 hover:outline-blue-600">Connect
        Wallet</button>
      <p v-else>Wallet: <span class="text-orange-400">{{ walletAddress }}</span></p>
    </div>

    <p class="my-2 text-center">
      After connect your wallet successfully. Fill the form above.
    </p>

    <div
      class="bg-stone-50 dark:bg-stone-700 rounded-lg p-6 flex flex-col gap-2 border border-stone-100 dark:border-stone-800 w-[600px] my-2">
      <h1 class="uppercase text-sm font-semibold text-stone-500 dark:text-stone-300">Hero</h1>
      <div class="flex gap-4">
        <button :disabled="!walletAddress" @click="checkLife"
          class="bg-stone-100 dark:bg-stone-800 rounded-lg p-2 px-4  text-md outline outline-slate-200 hover:outline-1 hover:outline-blue-600 disabled:text-gray-300 disabled:outline-none">Check
          Health</button>
        <button :disabled="!walletAddress" @click="drinkPotion"
          class="bg-stone-100 dark:bg-stone-800 rounded-lg p-2 px-4  text-md outline outline-slate-200 hover:outline-1 hover:outline-blue-600 disabled:text-gray-300 disabled:outline-none">Drink
          Potion</button>
      </div>
    </div>


    <form
      class="bg-stone-50 dark:bg-stone-700 rounded-lg p-6 flex flex-col gap-2 border border-stone-100 dark:border-stone-800 w-[600px] my-2">
      <h1 class="uppercase text-sm font-semibold text-stone-500 dark:text-stone-300">Dragon</h1>
      <div>
        <button @click.prevent="dragonsList"
          class="bg-stone-100 dark:bg-stone-800 rounded-lg p-2 px-4  text-md outline outline-slate-200 hover:outline-1 hover:outline-blue-600 disabled:text-gray-300 disabled:outline-none">List
          All Dragons</button>
      </div>
      <div class="flex gap-4">
        <input v-model="dragonIdInput" placeholder="Enter a dragon ID"
          class="bg-white dark:bg-stone-800 rounded-lg p-2 px-4  text-md outline outline-slate-200 focus:outline-1 focus:outline-blue-600 w-40" />

        <button @click.prevent="checkDragon" v-if="dragonIdInput"
          class="bg-stone-100 dark:bg-stone-800 rounded-lg p-2 px-4  text-md outline outline-slate-200 hover:outline-1 hover:outline-blue-600 disabled:text-gray-300 disabled:outline-none">Check
          Health</button>
        <button @click.prevent="attackDragon" :disabled="!walletAddress" v-if="dragonIdInput"
          class="bg-stone-100 dark:bg-stone-800 rounded-lg p-2 px-4  text-md outline outline-slate-200 hover:outline-1 hover:outline-blue-600 disabled:text-gray-300 disabled:outline-none">Attack</button>
      </div>
    </form>

    <div class="bg-stone-50 dark:bg-stone-700 rounded-lg p-6 my-2">
      <svg v-if="isLoading" width="50" height="20" viewBox="0 0 50 20">
        <circle cx="10" cy="10" r="4" fill="#000">
          <animate attributeName="opacity" values="1;0;0;0;0;0;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="10" r="4" fill="#000">
          <animate attributeName="opacity" values="0;1;0;0;0;0;0" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="10" r="4" fill="#000">
          <animate attributeName="opacity" values="0;0;1;0;0;0;0" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
      <VueJsonPretty v-else :data="message" :show-icon="true" :theme="isDarkMode ? 'dark' : 'light'" />
    </div>
  </div>
</template>
