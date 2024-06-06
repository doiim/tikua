import { useEffect, useState } from 'react'
import './App.css'
import { Tikua, Address, VoucherDecoded } from '@doiim/tikua'
import logo from './assets/logo.png'
import { createPublicClient, http, parseAbi } from 'viem';
import { hardhat } from 'viem/chains'

// Defining Dapp ABI to be able to decode any kind of Transfer voucher
const abi = [
  "function withdrawEther(address,uint256)",
  "function transferFrom(address,address,uint256)",
  "function transfer(address,uint256)",
  "function safeTransferFrom(address,address,uint256,uint256,bytes)",
  "function safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
  // Abi entries for fetch balances on VIEM
  "function balanceOf(address) returns (uint256)",
  "function ownerOf(uint256) returns (address)",
  "function balanceOf(address, uint256) returns (uint256)",
];

function App() {

  const [wallet, setWallet] = useState<Address>()
  const [provider, setProvider] = useState<any>()
  const [targetType, setTargetType] = useState<string>('')
  const [message, setMessage] = useState<string>('')

  const [tokenAmount, setTokenAmount] = useState<bigint | null>()
  const [tokenId, setTokenId] = useState<bigint | null>()

  const [vouchers, setVouchers] = useState<VoucherDecoded[]>([])

  useEffect(() => {
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
    return tikua.addVouchersListener(
      1000,
      concatVouchers
    )
  }

  const concatVouchers = async (v: VoucherDecoded[]) => {
    setVouchers((prevVouchers) => {
      return [...prevVouchers, ...v]
    })
  }

  const handleSetTokenAmount = async (e: any) => {
    try {
      setTokenAmount(BigInt(parseInt(e.target.value)))
    } catch (err) {
      alert('Not able to parse amount')
    }
  }

  const handleSetTokenID = async (e: any) => {
    try {
      setTokenId(BigInt(parseInt(e.target.value)))
    } catch (err) {
      alert('Not able to parse amount')
    }
  }

  const depositEther = async (e: any) => {
    e.preventDefault()
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    await tikua.depositEther(tokenAmount, '')
  }

  const approveERC721 = async (e: any) => {
    e.preventDefault()
    if (tokenId == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1'
    const hashApprove = await tikua.approveERC721(tokenAddress, tokenId);
    console.log('Approved', hashApprove)
  }

  const depositERC721 = async (e: any) => {
    e.preventDefault()
    if (tokenId == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1'
    const hash = await tikua.depositERC721(tokenAddress, tokenId, '', '');
    console.log('Deposit ERC721 request sent.', hash)
  }

  const approveERC20 = async (e: any) => {
    e.preventDefault()
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x59b670e9fa9d0a427751af201d676719a970857b'
    const hashApprove = await tikua.approveERC20(tokenAddress, tokenAmount);
    console.log('Approved', hashApprove)
  }

  const depositERC20 = async (e: any) => {
    e.preventDefault()
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x59b670e9fa9d0a427751af201d676719a970857b'
    const hash = await tikua.depositERC20(tokenAddress, tokenAmount, '');
    console.log('Deposit ERC721 request sent.', hash)
  }

  const approveERC1155Single = async (e: any) => {
    e.preventDefault()
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    if (tokenId == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x322813fd9a801c5507c9de605d63cea4f2ce6c44'
    const hashApprove = await tikua.approveSingleERC1155(tokenAddress);
    console.log('Approved', hashApprove)
  }

  const depositERC1155Single = async (e: any) => {
    e.preventDefault()
    if (tokenId == null) {
      alert('token Id is invalid')
      return
    }
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x322813fd9a801c5507c9de605d63cea4f2ce6c44'
    const hash = await tikua.depositSingleERC1155(tokenAddress, tokenId, tokenAmount, '', '');
    console.log('Deposit ERC721 request sent.', hash)
  }

  const approveERC1155Batch = async (e: any) => {
    e.preventDefault()
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    if (tokenId == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x322813fd9a801c5507c9de605d63cea4f2ce6c44'
    const hashApprove = await tikua.approveBatchERC1155(tokenAddress);
    console.log('Approved', hashApprove)
  }

  const depositERC1155Batch = async (e: any) => {
    e.preventDefault()
    if (tokenAmount == null) {
      alert('token amount is invalid')
      return
    }
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const tokenAddress = '0x322813fd9a801c5507c9de605d63cea4f2ce6c44'
    const hash = await tikua.depositBatchERC1155(tokenAddress, [BigInt(0), BigInt(1), BigInt(2)], [tokenAmount, tokenAmount, tokenAmount], '', '');
    console.log('Deposit ERC721 request sent.', hash)
  }

  const handleSubmit = async (e: any) => {
    setTargetType(e.target.id)
    setMessage('')
  }

  const checkVoucher = async (v: VoucherDecoded) => {
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    alert(`Voucher ${await tikua.checkVoucher(v) ? 'was executed' : 'not executed'}`)
  }

  const executeVoucher = async (v: VoucherDecoded) => {
    const tikua = new Tikua({
      provider: provider,
      appAddress: '0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e',
      signerAddress: wallet,
      abi
    })
    const hash = await tikua.executeVoucher(v)
    console.log('Voucher executed.', hash)
  }

  const checkBalance = async (e: any) => {
    e.preventDefault()
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http(),
    })
    switch (targetType) {
      case 'Ether':
        setMessage('Ether Balance: ' + await publicClient.getBalance({ address: wallet }))
        break
      case 'ERC20':
        setMessage('ERC20 Balance: ' + await publicClient.readContract({
          address: '0x59b670e9fa9d0a427751af201d676719a970857b',
          abi: parseAbi(abi),
          functionName: 'balanceOf',
          args: [wallet]
        }))
        break
      case 'ERC721':
        setMessage('ERC721 Owner of token Id ' + tokenId + ':' + await publicClient.readContract({
          address: '0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1',
          abi: parseAbi(abi),
          functionName: 'ownerOf',
          args: [tokenId]
        }))
        break
      case 'ERC1155Single':
      case 'ERC1155Batch':
        setMessage('ERC1155 Owner of token Id ' + 1 + ':' + await publicClient.readContract({
          address: '0x322813fd9a801c5507c9de605d63cea4f2ce6c44',
          abi: parseAbi(abi),
          functionName: 'balanceOf',
          args: [wallet, 1]
        }))
        break
    }

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
          <div className='filterType'>
            <form onChange={handleSubmit}>
              <label htmlFor="Ether"><input type="radio" id="Ether" name="age" />Ether</label>
              <label htmlFor="ERC20"><input type="radio" id="ERC20" name="age" />ERC20</label>
              <label htmlFor="ERC721"><input type="radio" id="ERC721" name="age" />ERC721</label>
              <label htmlFor="ERC1155Single"><input type="radio" id="ERC1155Single" name="age" />ERC1155 Single</label>
              <label htmlFor="ERC1155Batch"><input type="radio" id="ERC1155Batch" name="age" />ERC1155 Batch</label>
            </form>
            <div className='dragonCommands'>
              <p>
                <strong>Sequence for approval and send tokens to Portals:</strong> This process involves
                approve the specifics for the tokens and send. The exception is Ethers that could be sent without approval.
                First select a token on the left, then fill out the form.
              </p>
              {/* ETHER DEPOSIT MODAL */}
              {targetType == 'Ether' ? <form>
                <label>
                  <span>Amount:</span>
                  <input type="number" onBlur={handleSetTokenAmount} />
                </label>
                <input type="submit" value="Check balance" onClick={checkBalance} />
                <input type="submit" value="Send to Ether Portal" onClick={depositEther} />
              </form> : null}
              {/* ERC20 DEPOSIT MODAL */}
              {targetType == 'ERC20' ? <form>
                <label>
                  <span>Amount:</span>
                  <input type="number" onBlur={handleSetTokenAmount} />
                </label>
                <input type="submit" value="Check balance" onClick={checkBalance} />
                <input type="submit" value="Approve to ERC20 Portal" onClick={approveERC20} />
                <input type="submit" value="Send to ERC20 Portal" onClick={depositERC20} />
              </form> : null}

              {/* ERC721 DEPOSIT MODAL */}
              {targetType == 'ERC721' ? <form>
                <label>
                  <span>ID:</span>
                  <input type="number" onBlur={handleSetTokenID} />
                </label>
                <input type="submit" value="Check balance" onClick={checkBalance} />
                <input type="submit" value="Approve to ERC721 Portal" onClick={approveERC721} />
                <input type="submit" value="Send to ERC721 Portal" onClick={depositERC721} />
              </form> : null}

              {/* ERC1155 SINGLE DEPOSIT MODAL */}
              {targetType == 'ERC1155Single' ? <form>
                <label>
                  <span>ID:</span>
                  <input type="number" onBlur={handleSetTokenID} />
                </label>
                <label>
                  <span>Amount:</span>
                  <input type="number" onBlur={handleSetTokenAmount} />
                </label>
                <input type="submit" value="Check balance" onClick={checkBalance} />
                <input type="submit" value="Approve to ERC1155 Portal" onClick={approveERC1155Single} />
                <input type="submit" value="Send to ERC1155 Portal" onClick={depositERC1155Single} />
              </form> : null}

              {/* ERC1155 BATCH DEPOSIT MODAL */}
              {targetType == 'ERC1155Batch' ? <form>
                <label>This example always transfer an amount for the first three token IDs</label>
                <label>
                  <span>ID: [0,1,2]</span>
                </label>
                <label>
                  <span>ERC1155 Amount:</span>
                  <input type="number" onBlur={handleSetTokenAmount} />
                </label>
                <input type="submit" value="Check balance" onClick={checkBalance} />
                <input type="submit" value="Approve to ERC1155 Portal" onClick={approveERC1155Batch} />
                <input type="submit" value="Send to ERC1155 Portal" onClick={depositERC1155Batch} />
              </form> : null}
              <div>{message}</div>
            </div>
          </div>
          <div className='message'>
            <h4>Vouchers list</h4>
            <table>
              <thead>
                <tr>
                  <th>Input Index</th>
                  <th>Voucher Index</th>
                  <th>Function</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((row) => {
                  return <tr key={row.input.index}> {/* Use a unique key for each row */}
                    <td>{row.input.index}</td>
                    <td>{row.proof?.validity.inputIndexWithinEpoch}</td>
                    <td>{row.decodedPayloadFunction}</td>
                    <td>
                      <button onClick={checkVoucher.bind(undefined, row)}>Check</button>
                      <button onClick={executeVoucher.bind(undefined, row)}>Execute</button>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </> : null}
      </div>
    </>
  )
}

export default App
