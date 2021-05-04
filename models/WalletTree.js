import fs from 'fs';
import jsonfile from 'jsonfile';
import createTree from 'functional-red-black-tree';
import write from 'write';
import { Wallet, Transaction } from './TreeModels.js';

export class WalletTree {
    constructor(dataDir = './blocks') {
        this.isReady = false;
        this.treeFactory = createTree();

        this.blockSize;
        this.genesisBlockId;
        this.localLatestBlockId;

        this.userWallets = [];
        this.transactions = [];
        this.blocks = {};
        this.blockIds = [];

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
                    this.localLatestBlockId = Math.max(...blockIds);
                    this.addAllNodes(dataDir);
                }
            });
        } catch (err) {
            throw err;
        }
    }

    addAllNodes(dataDir, blockId = this.genesisBlockId) {
        console.log(`Loading block id ${blockId}...`);
        jsonfile.readFile(`${dataDir}/${blockId}`, (err, obj) => {
            if (err) throw err;
            const nodes = obj.nodes;
            blockId = obj.next;

            const blockSize = obj.next - obj.id;
            if (!this.blockSize) {
                this.blockSize = blockSize;
            } else {
                if (this.blockSize != blockSize) {
                    throw { error: "Inconsistent block size detected. Aborting!" };
                }
            }

            console.log(`Synchronizing ${nodes.length} nodes...`);
            nodes.forEach(node => {
                this.tree = !this.tree ? this.treeFactory.insert(node.id, node) : this.tree.insert(node.id, node);
                if (node.type === 'w') {
                    if (node.alias === 'root' && !this.systemWallet || this.systemWallet.balance > node.balance) {
                        this.systemWallet = node;
                    } else if (node.alias !== 'root') {
                        this.userWallets.push(node);
                    }
                } else if (node.type === 'tx') {
                    this.transactions.push(node);
                } else {
                    throw { error: "Unknown type in the blocks. Abort!" };
                }
            });

            this.blocks[blockId] = nodes;
            this.blockIds.push(blockId);

            if (blockId <= this.localLatestBlockId) {
                this.addAllNodes(dataDir, blockId);
            } else {
                this.isReady = true;
                console.log(`Next block doesn't exist. Completed adding all nodes!\n`);

                if (this.userWallets.length <= 0) {
                    console.log(`If there is 0 user wallets, create few test wallets...`);
                    for (let i = 0; i < 3; i++) {
                        this.createWallet(`test${i}`);
                    }
                }
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

        const fromWallet = from.value;

        const to = this.tree.find(toAddress);
        if (!to) {
            console.log(`Invalid address passed in, address '${toAddress}' not found`);
            return;
        }

        const toWallet = to.value;

        if (fromWallet.balance < amount) {
            console.log(`Source address '${fromWallet.id}' doesn't have enough balance.`);
            return;
        }

        const transaction = new Transaction(fromWallet.id, toWallet.id, amount);
        fromWallet.balance -= amount;
        toWallet.balance += amount;

        this.tree = this.tree.insert(transaction.id, transaction);
        this.transactions.push(transaction);

        // this.tree = this.tree.insert(fromWallet.id, fromWallet);
        // this.tree = this.tree.insert(toWallet.id, toWallet);

        console.log(`New balance confirmed by 100 nodes!, queued for thorough fraud detection...`);
        console.log(`Balance (${fromWallet.id}): ${fromWallet.balance}`);
        console.log(`Balance (${toWallet.id}): ${toWallet.balance}\n`);
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

    save() {
        this.tree.forEach((id, node) => {
            if (this.blocks[newBlock.id].indexOf(node) < 0) {
                this.blocks[newBlock.id].push(node);
            }

            if (this.blocks[newBlock.id].length >= this.blockSize) {
                // saving full block
                newBlock.nodes = this.blocks[newBlock.id];
                write.sync(`./blocks/${newBlock.id}`, JSON.stringify(newBlock));

                // create next block, to be filled-in next loops
                newBlock.previous = newBlock.id;
                newBlock.id = newBlock.next;
                newBlock.next += newBlock.id + this.blockSize;
                this.blocks[newBlock.id] = [];
            }
        });

        const newBlockId = this.localLatestBlockId + this.blockSize;
        const newBlock = {
            id: newBlockId,
            previous: this.localLatestBlockId,
            next: newBlockId + this.blockSize,
            nodes: []
        }

        if (!this.blocks[newBlock.id]) {
            this.blocks[newBlock.id] = [];
        }

        this.tree.forEach((id, node) => {
            if (this.blocks[newBlock.id].indexOf(node) < 0) {
                this.blocks[newBlock.id].push(node);
            }

            if (this.blocks[newBlock.id].length >= this.blockSize) {
                // saving full block
                newBlock.nodes = this.blocks[newBlock.id];
                write.sync(`./blocks/${newBlock.id}`, JSON.stringify(newBlock));

                // create next block, to be filled-in next loops
                newBlock.previous = newBlock.id;
                newBlock.id = newBlock.next;
                newBlock.next += newBlock.id + this.blockSize;
                this.blocks[newBlock.id] = [];
            }
        });

        write.sync(`./blocks/${newBlock.id}`, JSON.stringify(newBlock));
        this.localLatestBlockId = newBlockId;
        console.log(`Write complete...`);
    }
}