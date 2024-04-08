import { useEffect, useState } from 'react'
import './App.css'
import Onboard, { WalletState } from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import { CartesiSDK, Address } from '@doiim/cartesi-sdk'
import { gql } from '@urql/core'

// GraphQL query to retrieve notices given a cursor
export const GET_NOTICES_QUERY = gql`
query GetNotices($cursor: String) {
        notices(first: 3, after: $cursor) {
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


const injected = injectedModule()

const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: '0x7A69',
      token: 'ETH',
      label: 'Local Sunodo',
      rpcUrl: 'http://localhost:8545'
    }
  ]
})

const abi = [
  "function attackDragon(uint256 dragonId)",
  "function drinkPotion()",
  "function heroStatus(address player) returns (uint256)",
  "function dragonStatus(uint256 dragonId) returns (uint256)",
];

function App() {

  const [wallets, setWallets] = useState<WalletState[]>([])
  const [dragonId, setDragonId] = useState<number>(0)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const state = onboard.state.select()
    const { unsubscribe } = state.subscribe((update) => {
      setWallets(update.wallets)
    })
    // return () => {
    //   unsubscribe()
    // }
  }, [])

  const connectWallet = async () => {
    setWallets(await onboard.connectWallet())
    startSubscription();
  }

  const attackDragon = async (e: any) => {
    e.preventDefault()
    const cartesiSDK = new CartesiSDK({
      provider: onboard.state.get().wallets[0].provider,
      address: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
      account: wallets[0].accounts[0].address as Address,
      abi
    })
    await cartesiSDK.sendInput('attackDragon', [dragonId])
  }

  const drinkPotion = async () => {
    const cartesiSDK = new CartesiSDK({
      provider: onboard.state.get().wallets[0].provider,
      address: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
      account: wallets[0].accounts[0].address as Address,
      abi
    })
    await cartesiSDK.sendInput('drinkPotion', [])
  }

  const checkLife = async () => {
    const cartesiSDK = new CartesiSDK({
      provider: onboard.state.get().wallets[0].provider,
      endpoint: 'http://localhost:8080',
      abi
    })
    const status = await cartesiSDK.fetchInspect('heroStatus', [wallets[0].accounts[0].address as Address])
    setMessage('Hero life: ' + status);
  }

  const checkDragon = async (e: any) => {
    e.preventDefault()
    const cartesiSDK = new CartesiSDK({
      provider: onboard.state.get().wallets[0].provider,
      endpoint: 'http://localhost:8080',
      address: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
      abi: abi
    })
    const status = await cartesiSDK.fetchInspect('dragonStatus', [dragonId])
    setMessage('Dragon ' + dragonId + ' life: ' + status);
  }

  const startSubscription = async () => {
    const cartesiSDK = new CartesiSDK({
      provider: onboard.state.get().wallets[0].provider,
      endpoint: 'http://localhost:8080',
      abi: abi
    })
    return cartesiSDK.addNoticesListener(1000, (e) => setMessage(JSON.stringify(e)))
  }

  return (
    <>
      <h1>Cartesi SDK Test</h1>
      <div className="card">
        {wallets.length == 0 ?
          <button onClick={connectWallet}>Connect Wallet</button>
          : <p>Wallet: <span className='orange'>{wallets[0].accounts[0].address}</span></p>}
        <p>
          After connect your wallet successfully. Fill the form above.
        </p>
        <div className='heroCommands'>
          {wallets.length > 0 ?
            <button onClick={drinkPotion}>Drink Potion</button> : null
          }
          {wallets.length > 0 ?
            <button onClick={checkLife}>Check Hero Status</button> : null
          }
        </div>
        <form>
          <label>
            <span>Dragon Id</span>
            <input type="number" onChange={(e) => setDragonId(Number(e.target.value))} />
          </label>
          {dragonId > 0 ? <input type="submit" value="Dragon Status" onClick={checkDragon} /> : null}
          {dragonId > 0 ? <input type="submit" value="Attack Dragon" onClick={attackDragon} /> : null}
        </form>

        <p className="orange">{message}</p>
      </div>
    </>
  )
}

export default App
