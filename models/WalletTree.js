import fs from 'fs';
import jsonfile from 'jsonfile';
import createTree from 'functional-red-black-tree';
import write from 'write';
import { Wallet, Transaction } from './TreeModels.js';

export class WalletTree {
    constructor(dataDir = './blocks') {
        this.isReady = false;
        this.treeFactory = createTree();

        this.genesisBlockId;
        this.currentBlockId;

        this.userWallets = [];
        this.transactions = [];

        this.systemWallet;
        this.tree;

        try {
            fs.readdir(dataDir, (err, files) => {
                if (err) {
                    console.log(`Data directory, '${dataDir}' doesn't exist. Need to download, extract.`);
                    throw err;
                }
    
                console.log(`Block data directory exists!`);
                const blockIds = [];
                files.forEach(f => {
                    blockIds.push(parseInt(f));
                })

                if (blockIds.length > 0) {
                    this.genesisBlockId = Math.min(...blockIds);
                    this.currentBlockId = Math.max(...blockIds);
                    this.addAllNodes(dataDir);
                }
            });
        } catch (err) {
            throw err;
        }
    }

    addAllNodes(dataDir, nextBlockId = this.genesisBlockId) {
        console.log(`Loading block id ${nextBlockId}...`);
        jsonfile.readFile(`${dataDir}/${nextBlockId}`, (err, obj) => {
            if (err) throw err;
            const nodes = obj.nodes;
            nextBlockId = obj.next;

            console.log(`Synchronizing ${nodes.length} nodes...`);
            nodes.forEach(node => {
                this.tree = !this.tree ? this.treeFactory.insert(node.id, node) : this.tree.insert(node);
                if (node.type === 'w') {
                    if (node.alias === 'root') {
                        this.systemWallet = node;
                    } else {
                        this.userWallets.push(node);
                    }
                } else if (obj.type === 'tx') {
                    this.transactions.push(node);
                }
            });

            if (nextBlockId < this.currentBlockId) {
                this.addAllNodes(dataDir, nextBlockId);
            } else {
                this.isReady = true;
                console.log(`Next block doesn't exist. Completed adding all nodes!\n`);
            }
        })
    }

    getWallet(address) {
        const node = this.tree.find(address);
        if (!node) throw { error: { code: 404, message: `Given address ${address} was not found in the system tree.` } };
        else return node.value;
    }

    createWallet(alias, referrer) {
        const wallet = new Wallet(alias);
        // !referrer ? this.root.insert(wallet.address, wallet) : referrer.insert(wallet.address, wallet);
        this.tree = this.tree.insert(wallet.id, wallet);
        this.userWallets.push(wallet);
    }

    createTransaction(toAddress, amount, fromAddress = this.systemWallet.id) {
        console.log(`Transferring '${amount}' MDC from '${fromAddress}' to '${toAddress}'...`);
        const from = this.tree.find(fromAddress);
        if (!from) {
            console.log(`Invalid address passed in, address '${fromAddress}' not found`);
            return;
        }

        const to = this.tree.find(toAddress);
        if (!to) {
            console.log(`Invalid address passed in, address '${toAddress}' not found`);
            return;
        }

        if (from.value.balance < amount) {
            console.log(`Source address '${from.value.id}' doesn't have enough balance.`);
            return;
        }

        const transaction = new Transaction(from.value.id, to.value.id, amount);
        from.value.balance -= amount;
        to.value.balance += amount;
        this.tree = this.tree.insert(transaction.id, transaction);
        this.transactions.push(transaction);

        console.log(`New balance confirmed by 100 nodes!, queued for thorough fraud detection...`);
        console.log(`Balance (${from.value.id}): ${from.value.balance}`);
        console.log(`Balance (${to.value.id}): ${to.value.balance}\n`);
    }

    log() {
        if (!this.tree) {
            console.log(`Tree not initilaized yet...`);
            return;
        }

        console.log(`------------------------- Tree snapshot ----`);
        console.log(`Size: ${this.tree.length}, wallets: ${this.userWallets.length}, transactions: ${this.transactions.length}`);
        console.log(`${this.systemWallet.id}, Balance: ${this.systemWallet.balance} MDC`);

        this.userWallets.forEach(w => {
            console.log(`${w.id} (${w.alias}), Balance: ${w.balance} MDC`);
        });

        console.log(`Transactions: ${this.transactions.length}`);

        console.log(`--------------------------------------------\n`);
    }

    save(checkpoint, previous, next) {
        const block = {
            id: checkpoint,
            previous: previous,
            next: next,
            nodes: []
        }

        const nodes = [];
        this.tree.forEach((id, node) => {
            block.nodes.push(node);
        });

        write.sync(`./blocks/${block.id}`, JSON.stringify(block));
    }
}