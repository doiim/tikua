import { useEffect, useState } from 'react'
import './App.css'
import { Tikua, Address } from '@doiim/tikua'
import ReactJson from '@vahagn13/react-json-view'
import logo from './assets/logo.png'

// Add property to allow JSON to be serialized on the frontend
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

// Defining Dapp ABI
const abi = [
  "struct Dragon { uint256 id; uint256 life; }",
  "function attackDragon(uint256 dragonId)",
  "function drinkPotion()",
  "function heroStatus(address player) returns (uint256)",
  "function dragonStatus(uint256 dragonId) returns (uint256)",
  "function dragonsList() returns (Dragon[])",
];

function App() {

  const [wallet, setWallet] = useState<Address>()
  const [provider, setProvider] = useState<any>()
  const [dragonId, setDragonId] = useState<number>(0)
  const [message, setMessage] = useState<object>({})
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    // Add listener to update styles
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => setIsDarkMode(e.matches ? true : false));

    // Setup dark/light mode for the first time
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? true : false)

    // Remove listener
    return () => {
      // unsubscribe()
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => { })
    }
    connectWallet()
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) throw Error("MetaMask not found");
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x7A69",
          chainName: "Local Anvil",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["http://localhost:8545"],
        },
      ],
    });
    const [account] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (!account) throw Error("MetaMask reject");

    setWallet(account);
    setProvider(window.ethereum);

    await startSubscription(account);
  }

  const attackDragon = async (e: any) => {
    e.preventDefault()
    const tikua = new Tikua({
      provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    await tikua.sendInput('attackDragon', [dragonId])
  }

  const drinkPotion = async () => {
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    await tikua.sendInput('drinkPotion', [])
  }

  const checkLife = async () => {
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi
    })
    const status = await tikua.fetchInspect('heroStatus', [wallet])
    setMessage({
      life: status
    })
  }

  const checkDragon = async (e: any) => {
    e.preventDefault()
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi: abi
    })
    const status = await tikua.fetchInspect('dragonStatus', [dragonId])
    setMessage({
      dragonId: dragonId,
      status: status
    });
  }

  const dragonsList = async (e: any) => {
    e.preventDefault()
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi: abi
    })
    const status = await tikua.fetchInspect('dragonsList', []) as any[]
    setMessage(status);
  }

  /**
   * This function starts a subscription by creating a new CartesiSDK instance
   * and adding a notices listener that updates the message state.
   *
   * @return {Promise<void>} Returns a Promise that resolves when the notices listener is added.
   */
  const startSubscription = async (account: Address) => {
    const tikua = new Tikua({
      appEndpoint: 'http://localhost:8080',
      abi: abi
    })
    return tikua.addMyNoticesListener(
      1000,
      account,
      (e) => setMessage(e)
    )
  }

  return (
    <>
      <img src={logo} width={200} height={200}></img>
      <h1>Tikua</h1>
      <p>an isomorphic Cartesi SDK</p>
      <div className="card">
        {!wallet ?
          <button onClick={connectWallet}>Connect Wallet</button>
          : <p>Wallet: <span className='orange'>{wallet}</span></p>}
        {wallet ? <>
          <div className='heroCommands'>
            <div>
              <button onClick={drinkPotion}>Drink Potion</button>
              <p>
                <strong>Drink Potion:</strong> This is a write request that sends an
                input to the dApp, triggering the advance execution, which will
                generate notices.
              </p>
            </div>
            <div>
              <button onClick={checkLife}>Check Hero Status</button>
              <p>
                <strong>Check Health:</strong> This is a read-only request that sends
                an inspect request to the dApp and retrieves a report on the health
                status.
              </p>
            </div>
          </div>
          <div className='dragonCommands'>
            <button onClick={dragonsList}>List Dragons</button>
            <p>
              <strong>List All Dragons and Check Health:</strong> This is a
              read-only request that sends an inspect request to the dApp and
              retrieves a report with all dragons.
            </p>

            <form>
              <label>
                <span>Dragon Id</span>
                <input type="number" onChange={(e) => setDragonId(Number(e.target.value))} />
              </label>
              {dragonId >= 0 ? <input type="submit" value="Dragon Status" onClick={checkDragon} /> : null}
              {dragonId >= 0 ? <input type="submit" value="Attack Dragon" onClick={attackDragon} /> : null}
            </form>
            <p>
              <strong>Attack:</strong> This is a write request that sends an input
              to the dApp, triggering the advance execution, which will generate
              notices.
            </p>
          </div>
          <div className='message'>
            <ReactJson theme={isDarkMode ? "monokai" : "bright:inverted"} displayDataTypes={false} src={message} style={{ color: 'rgb(253, 151, 31)' }} />
          </div>
        </> : null}
      </div>
    </>
  )
}

export default App
