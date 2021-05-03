import { v4 as uuidv4 } from 'uuid';

export class TreeNode {
    constructor(type) {
        this.id = uuidv4();
        this.type = type;
        this.creationTime = new Date().getTime();
    }
}

export class Wallet extends TreeNode {
    constructor(alias) {
        super('w');
        this.alias = alias;
        this.balance = 0;
        this.hashPower = Math.floor(Math.random() * 1000);
    }
}

export class Transaction extends TreeNode {
    constructor(from, to, amount) {
        super('tx');
        this.from = from;
        this.to = to;
        this.amount = amount;
    }
}
