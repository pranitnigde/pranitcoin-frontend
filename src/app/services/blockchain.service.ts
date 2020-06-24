import { Injectable } from '@angular/core';
var SHA256 = require("crypto-js/sha256");
const EC1 = require('elliptic').ec;
import EC from 'elliptic';

declare var require: any;
@Injectable({
  providedIn: 'root'
})

export class BlockchainService {
  public blockchainInstance = new BlockChain();
  public walletKeys: Array<IWalletKey> = [];

  constructor() {
    this.blockchainInstance.difficulty = 1;
	this.blockchainInstance.minePendingTransactions('admin');
    this.generateWalletKeys();
  }

  minePendingTransactions() {
    this.blockchainInstance.minePendingTransactions(
      this.walletKeys[0].publicKey
    );
  }

  addressIsFromCurrentUser(address) {
    return address === this.walletKeys[0].publicKey;
  }

  generateWalletKeys() {
    const ec = new EC.ec('secp256k1');
    const key = ec.genKeyPair();

    this.walletKeys.push({
      keyObj: key,
      publicKey: key.getPublic('hex'),
      privateKey: key.getPrivate('hex'),
    });

    console.log(this.walletKeys);
  }

  getPendingTransactions() {
    return this.blockchainInstance.pendingTransactions;
  }

  addTransaction(tx) {
    this.blockchainInstance.addTransaction(tx);
  }
}

export class Transactions {
	fromAddress: string;
	toAddress: string;
	amount: number;
	timestamp: Date;
	signature: string;

	constructor(fromAddress="", toAddress="", amount=0) {
		this.fromAddress = fromAddress;
		this.toAddress = toAddress;
		this.amount = amount;
		this.timestamp = new Date();
		this.signature = "";
	}

	calculatehash() {
		return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
	}

	signTransaction(signingKey) {
		if (signingKey.getPublic('hex') !== this.fromAddress) {
			throw new Error("You cannot sign transactions for other wallets!");
		}
		const hashTx = this.calculatehash();
		const sig = signingKey.sign(hashTx, 'base64');

		this.signature = sig.toDER('hex');
	}

	isValid() {
		if (this.fromAddress === null) return true;

		if (!this.signature || this.signature.length === 0) {
			throw new Error('No signature in this transaction');
		}
		// const ec1 = new EC('secp256k1');
		const ecc = new EC1('secp256k1');
		const publicKey = ecc.keyFromPublic(this.fromAddress, 'hex');
		return publicKey.verify(this.calculatehash(), this.signature);
	}


}

export class Block {
	timestamp: Date;
	transactions = [];
	previousHash: string;
	hash: string;
	nonce: number;

	constructor(timestamp = new Date(), transactions=[], previousHash = "") {
		this.timestamp = timestamp;
		this.transactions = transactions;
		this.previousHash = previousHash;
		this.hash = this.calculatehash();
		this.nonce = 0;
	}

	calculatehash() {
		return SHA256(this.timestamp + this.previousHash + this.nonce + JSON.stringify(this.transactions)).toString();
	}
	mineBlock(difficulty) {
		while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
			this.nonce += 1;
			this.hash = this.calculatehash();
		}

		console.log("Block mined: " + this.hash);
	}
	hasValidTransactions() {
		for (const tx of this.transactions) {
			if (!tx.isValid()) {
				return false;
			}
		}
		return true;
	}
}

export class BlockChain {
	chain = [];
	difficulty: number;
	pendingTransactions = [];
	miningReward: number;

	constructor() {
		this.chain = [this.createGeneisBlock()];
		this.difficulty = 5;
		this.pendingTransactions = [];
		this.miningReward = 100;
	}

	createGeneisBlock() {
		return new Block(new Date("1999-04-21"), [], "0")
	}

	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}

	minePendingTransactions(miningRewardAddress) {
		const rewardTx = new Transactions(null, miningRewardAddress, this.miningReward);
		this.pendingTransactions.push(rewardTx);

		let block = new Block(new Date(), this.pendingTransactions, this.getLatestBlock().hash);
		block.mineBlock(this.difficulty);

		console.log("block Successfully mined");
		this.chain.push(block);

		this.pendingTransactions = [];
	}

	addTransaction(transaction) {

		if (!transaction.fromAddress || !transaction.toAddress) {
			throw new Error('Transaction must include from and to address');
		}
		console.log('check1');
		if (!transaction.isValid()) {
			throw new Error('Cannot add invalid transaction to chain');
		}
		console.log('check2');
		if (transaction.amount <= 0) {
			throw new Error('Transaction amount should be higher than 0');
		}

		// if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
		// 	throw new Error('Not enough balance');
		// }

		this.pendingTransactions.push(transaction);
		console.log('added into pending transaction successfully');
	}

	getBalanceOfAddress(address) {
		let balance = 0;

		for (const block of this.chain) {
			for (const trans of block.transactions) {
				if (trans.formAddress === address) {
					balance -= trans.amount;
				}
				if (trans.toAddress === address) {
					balance += trans.amount;
				}
			}
		}

		return balance;
	}

	getAllTransactionsForWallet(address) {
		const txs = [];

		for (const block of this.chain) {
			for (const tx of block.transactions) {
				if (tx.fromAddress === address || tx.toAddress === address) {
					txs.push(tx);
				}
			}
		}

		console.log('get transactions for wallet count:', txs.length);
		return txs;
	}

	isChainValid() {
		for (let i = 1; i < this.chain.length - 1; i++) {
			const currBlock = this.chain[i];
			const prevBlock = this.chain[i - 1];

			if (!currBlock.hasValidTransactions()) {
				console.log("1");
				return false;
			}

			if (currBlock.hash !== currBlock.calculatehash()) {
				console.log("2");
				return false;
			}

			if (currBlock.previousHash !== prevBlock.hash) { // to be tested
				console.log("3");
				console.log(this.chain);
				return false;
			}

		}
		console.log("true");
		return true;
	}
}



export interface IWalletKey {
  keyObj: any;
  publicKey: string;
  privateKey: string;
}