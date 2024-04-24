<script setup lang="ts">
import { ref } from 'vue';
import { Tikua, Address } from '@doiim/tikua'

// TODO: didn't work as expected
// import VueJsonPretty from 'vue-json-pretty'

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
const dragonIdInput = ref<number>()
const message = ref({})

const connect = async () => {
  if (!window.ethereum) throw Error('MetaMask not found')
  await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x7A69', chainName: "Local Anvil", nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},  rpcUrls: ['http://localhost:8545'] }] });
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  if (!account) throw Error('MetaMask reject')
  walletAddress.value = account
  provider.value = window.ethereum
  await startSubscription()
}

const startSubscription = async () => {
  if(!provider.value || !walletAddress.value) throw Error('Wallet not connected') 
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
  if(!walletAddress.value) return
  const tikua = new Tikua({
    provider: provider.value,
    address: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
    account: walletAddress.value,
    abi: ABI
  })
  await tikua.sendInput('drinkPotion', [])
}

const checkLife = async () => {
  if(!walletAddress.value) return
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
  if(dragonIdInput.value === undefined) return
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
  if(dragonIdInput.value === undefined) return
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
  <div class="main">
    <img src="./assets/logo.png" width=200 height=200 />
    <h1>Tikua</h1>
    <p>an isomorphic Cartesi SDK</p>
    <div class="card">
      <button v-if="!walletAddress" @click="connect">Connect Wallet</button>
      <p v-else>Wallet: <span class='orange'>{{ walletAddress }}</span></p>

      <p>
        After connect your wallet successfully. Fill the form above.
      </p>

      <div class='heroCommands'>
          <button :disabled="!walletAddress" @click="drinkPotion">Drink Potion</button>
          <button :disabled="!walletAddress" @click="checkLife">Check Hero Status</button>
          <button @click="dragonsList">List Dragons</button>
      </div>
      <form>
        <label>
          <span>Dragon ID</span>
          <input type="number" v-model="dragonIdInput" />
        </label>
        <button @click.prevent="checkDragon">Dragon Status</button>
        <button @click.prevent="attackDragon" :disabled="!walletAddress">Attack Dragon</button>
      </form>

      <div class='message' >
        {{ message }}
        
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.orange {
  color: orange;
}

form,
.heroCommands {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px;
}

form label {
  display: flex;
  gap: 20px;
}

.message {
  text-align: start;
}

</style>
