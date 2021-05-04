//import TreeModel from 'tree-model'
import cli from 'cli-ux';
import { WalletTree } from './models/WalletTree.js';

console.log("Starting ideatree...");

// class Thought {
//     constructor(thought) {
//         this.thought = thought;
//     }

//     log() {
//         console.log(`How can we ${this.thought}?`);
//     }
// }

// const thought = new Thought(`reduce water consumption of toilet`);
// thought.log();

// mining thoughts and deeds, which translates to the currency. Creativity Cloud Currency.
// node server is mining through validation of chain, rewarding the providers.

// const tree = TreeModel.
// root = tree.parse({ name: 'a', children: [{ name: 'b' }] });

// transaction validation?
// A --- ccc ---> B, premined cryptocurrency

// each node will either host full node, or private/seedtrees.
// Hosting full node will validate.
// Transaction is a tree activity.

// Scenario - make miner, community user, share good quality idea
//          - make miner revisit and engage, digital activity is next generation labor
//          - if actively participate in your interest or the cause you're fighting for - get rewarded.

let interval = 1;
let blockReward = 10000;
let recentActivities = 50000; // affects the hash rate.
let activeMembers = 100000; // affects the hash rate.
// let myStake = votes/totalVotes;
let difficulty = recentActivities + 100000 - 0; // higher more difficult
const blockSize = 3888;

let startTime = new Date().getTime();
console.log(`Getting wallet tree ready...\n`);

const walletTree = new WalletTree();

const lifecycle = setInterval(() => {
    if (!walletTree.isReady) {
        console.log(`Waiting for ready state... ${(new Date().getTime() - startTime)/1000}s elapsed.`);
        return;
    }

    // traverse through the community tree and reward.
    // higher votes higher hash rates, i.e. higher chance to get the share.
    // member count is the max hash rate.
    // upvote counts are distribution of rewards - need to loop all posts, airdrops on interval
    // Genesis block, 10000, to be used for foundation to be depleted in first 2 years of official launch.

    const systemCode = Math.floor(Math.random() * difficulty);
    const tryCounts = Math.floor(Math.random() * recentActivities + activeMembers);

    for (let i = 0; i < tryCounts; i++) {
        const guess = Math.floor(Math.random() * difficulty);

        if (systemCode == guess && walletTree.systemWallet.balance > 1) {
            console.log(`Cracked the code '${systemCode}' at ${i}th out of ${tryCounts} tries!!\n`);
            if (blockReward >= walletTree.systemWallet.balance) {
                blockReward = walletTree.systemWallet.balance;
            }

            let totalPower = 0;
            walletTree.userWallets.forEach(w => {
                totalPower += w.hashPower;
            });

            walletTree.userWallets.forEach(w => {
                const stake = w.hashPower / totalPower;
                const amount = blockReward * stake;

                walletTree.createTransaction(w.id, amount);
            });

            console.log(`${walletTree.userWallets.length} active wallets rewarded total ${blockReward} MDC!, System balance: ${walletTree.systemWallet.balance} MDC`);
            walletTree.log();
            break;
        }
    }

    if (walletTree.userWallets.length > 0) {
        console.log(`Your balance is: ${walletTree.userWallets[0].balance} MDC`)
        console.log(`Hash rate: ${tryCounts}h/s`);
        console.log(`Interval: ${interval}, ${interval / 60 / 60} hrs\n`);
    }

    // if (interval % blockSize == 0) {
    //     console.log(`Interval at: ${interval}...`);
    //     const previousReward = blockReward;
    //     blockReward = blockReward / 2;
    //     console.log(`Having block rewards from ${previousReward} to ${blockReward}...\n`);

    //     // clearInterval(lifecycle);
    //     // walletTree.save(interval, interval > 0 ? interval - blockSize : 0, interval + blockSize);
    // }

    if (interval % 10 == 0) {
        walletTree.log();

        console.log(`Full validation and ledger write every 30s... Ledger locked.`);
        walletTree.isReady = false;
        walletTree.save();
        walletTree.isReady = true;
    }

    switch (interval) {
        case 5:
            // walletTree.createTransaction('b6606a0c-6834-4e55-aa1d-b5083051f8be', 30000, 'f0de7f7c-d49a-4a97-8962-5b1041a7ee44');
            console.log(`Test scenario on interval: ${interval} ended...\n`);
            break;
        default:
            break;
    }

    interval++;
}, 500);