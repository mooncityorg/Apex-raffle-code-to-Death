import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface GlobalPool {
    superAdmin: PublicKey,
}

export interface RafflePool {
    creator: PublicKey,
    nftMint: PublicKey,
    count: anchor.BN,
    winnerCount: anchor.BN,
    noRepeat: anchor.BN,
    maxEntrants: anchor.BN,
    endTimestamp: anchor.BN,
    ticketPricePrey: anchor.BN,
    ticketPriceSol: anchor.BN,
    whitelisted: anchor.BN,
    indexes: anchor.BN[],
    claimedWinner: anchor.BN[],
    winner: PublicKey[],
    entrants: PublicKey[],
    raffleKey: string
}   