# ApeX-Raffle-program
This is the raffle project that winners can receive the raffle NFT, spl-tokens or winners can buy NFTs by low price. You can buy tickets by $Sol and $PREY token.

## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/fury/.config/solana/id.json` in test case

## Usage
- Main script source for all functionality is here: `/cli/script.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/cli/raffle.json`

Able to test the script functions working in this way.
- Change commands properly in the main functions of the `script.ts` file to call the other functions
- Confirm the `ANCHOR_WALLET` environment variable of the `ts-node` script in `package.json`
- Run `yarn ts-node`

## Features

### - As a Smart Contract Owner
For the first time use, the Smart Contract Owner should `initialize` the Smart Contract for global account allocation.
- `initProject`


### - As the Creator of Raffle
The NFTs will be stored in the globalAuthority address.
When the admin creates a raffle, call the `creatRaffle` function, the NFT will be sent to the PDA and the data of this raffle is stored on blockchain.
```js
creatRaffle(
    userAddress: PublicKey,
    nft_mint: PublicKey,
    ticketPriceSol: number,
    ticketPriceReap: number,
    endTimestamp: number,
    rewardAmount: number,
    winnerCount: number,
    whitelisted: number,
    max: number
)
```

The creator can withdraw NFT from the PDA if nobody buys tickets and the time exceeds the endTime of raffle. 
```js
withdrawNft(
    userAddress: PublicKey,
    nft_mint: PublicKey
)
```

### - As the User of Raffle
When users buy tickets, call the `buyTicket` function, users will send $Sol and $REAP token to the raffle creator.
```js
buyTicket(
    userAddress: PublicKey,
    nft_mint: PublicKey,
    amount: number
)
```

When users want to see the winners, call `revealWinner` function.
```js
revealWinner(
    userAddress: PublicKey,
    nft_mint: PublicKey
)
```

### - As the Winner of Raffle
Winners can claim rewards by calling `claimReward` function.
```js
claimReward(
    userAddress: PublicKey,
    nft_mint: PublicKey
)
```
