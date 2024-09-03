# Apex | NFT Raffle Solana

## Requirements

### Payment method
- SOL
- $PREY (SPL token)

### Reward Type
- Reveive NFT
- Whitelist
- Tickets
- Reward Token

## Development

```bash
npm run dev
# or
yarn dev
```
### Install


```bash
npm install
# or
yarn install
```
### Problem Solved
- Pending transaction confirmed
``` javascript
- await solConnection.confirmTransaction(tx, "confirmed");

+ await solConnection.confirmTransaction(tx, "finalized");
```