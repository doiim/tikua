<script setup lang="ts">
import { ref } from 'vue';
import { Tikua, Address } from '@doiim/tikua'

// TODO: didn't work as expected
// import VueJsonPretty from 'vue-json-pretty'

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
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  if (!account) throw Error('MetaMask reject')
  walletAddress.value = account
  provider.value = window.ethereum
  await startSubscription()
}

const startSubscription = async () => {
  if(!provider.value || !walletAddress.value) throw Error('Wallet not connected') 
  const tikua = new Tikua({
    provider: provider,
    endpoint: 'http://localhost:8080',
    abi: ABI
  })
  tikua.addMyNoticesListener(
    1000,
    walletAddress.value,
    (e) => message.value = e
  )
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
          <button :disabled="!walletAddress" >Drink Potion</button>
          <button :disabled="!walletAddress">Check Hero Status</button>
          <button :disabled="!walletAddress">List Dragons</button>
      </div>
      <form>
        <label>
          <span>Dragon ID</span>
          <input type="number" v-model="dragonIdInput" />
        </label>
        <input type="submit" value="Dragon Status"  />
        <input type="submit" value="Attack Dragon"  />
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
