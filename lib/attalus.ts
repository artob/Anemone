import {Wallet} from "ethers";

const ethers = require("ethers");
import {JsonRpcProvider} from "ethers/providers";
import config from "../config"

const connect = (url: string): JsonRpcProvider => {
  return new ethers.providers.JsonRpcProvider(url, "");
};

const generateWallets = async (num: number) => {
  const wallets = [];
  for (let i: number = 0; i < num; i++) {
    const wallet = new ethers.Wallet.createRandom();
    wallets.push(wallet);
    const address = await wallet.getAddress();
    console.log(`Created wallet with address ${address}`)
    
  }
  console.log('\n');
  return wallets;
};

const fundWallets = async (wallets: Array<any>, mainWallet: any): Promise<string[]> => {
  //send each wa]llet the max possible gas amount for each transaction + the amount of the transaction as specified in config
  const numTransactions = ethers.utils.bigNumberify(config.numTransactions/config.numWallets);
  const transactionAmount = ethers.utils.bigNumberify(config.amount).mul(numTransactions);
  const maxGasAmount = (ethers.utils.bigNumberify(ethers.utils.parseUnits(config.gasPrice, "gwei")).mul(ethers.utils.bigNumberify(config.maxGas))).mul(numTransactions);
  const amount = transactionAmount.add(maxGasAmount);

  const txHashes: string[] = [];
  const numWallets = wallets.length;
  let nonce = await mainWallet.getTransactionCount();
  for (let i: number = 0; i < numWallets; i++) {
    const dest = await wallets[i].getAddress();
    const tx = {
      nonce: nonce,
      value: amount,
      to: dest,
      gasLimit: ethers.utils.bigNumberify(config.maxGas),
      gasPrice: ethers.utils.parseUnits(config.gasPrice, "gwei"),
      chainId: 1337
    };
    const txResponse = await mainWallet.sendTransaction(tx);
    console.log("send")
    txHashes.push(txResponse.hash);
    nonce += 1;
  }

  return txHashes;

}


const batchTxs = async (wallets: Array<any>, provider: JsonRpcProvider) => {
  //we want to split the transactions equally among the wallets to be sent from.
  const numTransactions = ethers.utils.bigNumberify(Math.ceil(config.numTransactions/config.numWallets));
  const amount = ethers.utils.bigNumberify(config.amount);
  const txs: any = [];
  const numWallets = wallets.length;  for (let i: number = 0; i < wallets.length; i++) {
    const sender: Wallet = new ethers.Wallet(wallets[i].privateKey, provider);
    console.log("batch1");

    let nonce = 0;
    for (let j = 0; j < numTransactions; j++) {
      //"randomly" select wallet among created wallets to receive transaction
      const destIndex = Math.floor(Math.random() * (numWallets));
      const dest = await wallets[destIndex].getAddress();
      const tx = {
	      nonce: nonce,
        value: amount,
        to: dest,
        gasLimit: ethers.utils.bigNumberify(config.maxGas),
        gasPrice: ethers.utils.parseUnits(config.gasPrice, "gwei"),
        chainId: 1337
      };
      nonce += 1;
      console.log("sent tx")
      await sender.sendTransaction(tx);
      txs.push(tx); 
    }
    }
  console.log(`\n Created and broadcasted ${txs.length} transactions.`);
  return txs;
};

export {
  connect,
  generateWallets,
  fundWallets,
  batchTxs
}