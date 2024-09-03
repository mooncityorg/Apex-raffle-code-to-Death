import * as anchor from '@project-serum/anchor';
import {
    PublicKey,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletContextState } from '@solana/wallet-adapter-react';
import { DECIMALS, GLOBAL_AUTHORITY_SEED, PREY_DECIMALS, PREY_TOKEN_MINT, PROGRAM_ID, RAFFLE_SIZE } from '../config';
import { solConnection } from './utils';
import { IDL } from './raffle';
import { RafflePool } from './type';
import { successAlert } from '../components/toastGroup';

/**
 * @dev CreateRaffle function
 * @param userAddress The raffle creator's address
 * @param nft_mint The nft_mint address
 * @param ticketPriceSol The ticket price by SOL 
 * @param ticketPricePrey The ticket price by PREY token
 * @param endTimestamp The raffle end timestamp
 * @param winnerCount The winner_cap of this raffle
 * @param whitelisted The variable if 1: winner get NFt as price and if 0: get whitelist spot  2: get spl token reward
 * @param max The max entrants of this raffle
 */
export const createRaffle = async (
    wallet: WalletContextState,
    nft_mint: PublicKey,
    ticketPriceSol: number,
    ticketPricePrey: number,
    endTimestamp: number,
    rewardAmount: number,
    winnerCount: number,
    whitelisted: number,
    max: number,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (!wallet.publicKey) return;
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    const userAddress = wallet.publicKey;
    try {

        const [globalAuthority, bump] = await PublicKey.findProgramAddress(
            [Buffer.from(GLOBAL_AUTHORITY_SEED)],
            program.programId
        );

        let ownerNftAccount = await getAssociatedTokenAccount(userAddress, nft_mint);

        let ix0 = await getATokenAccountsNeedCreate(
            solConnection,
            userAddress,
            globalAuthority,
            [nft_mint]
        );

        let ix1 = await getATokenAccountsNeedCreate(
            solConnection,
            userAddress,
            userAddress,
            [PREY_TOKEN_MINT]
        );

        let raffle;
        let i;

        for (i = 10; i > 0; i--) {
            raffle = await PublicKey.createWithSeed(
                userAddress,
                nft_mint.toBase58().slice(0, i),
                program.programId,
            );
            let state = await getStateByKey(raffle);
            if (state === null) {
                console.log(i);
                break;
            }
        }
        console.log(i);
        if (raffle === undefined) return;
        let ix = SystemProgram.createAccountWithSeed({
            fromPubkey: userAddress,
            basePubkey: userAddress,
            seed: nft_mint.toBase58().slice(0, i),
            newAccountPubkey: raffle,
            lamports: await solConnection.getMinimumBalanceForRentExemption(RAFFLE_SIZE),
            space: RAFFLE_SIZE,
            programId: program.programId,
        });
        let tx = new Transaction();
        tx.add(ix);
        if (ix0.instructions.length !== 0) tx.add(...ix0.instructions);
        if (ix1.instructions.length !== 0) tx.add(...ix1.instructions);

        tx.add(program.instruction.createRaffle(
            bump,
            new anchor.BN(ticketPricePrey * PREY_DECIMALS),
            new anchor.BN(ticketPriceSol * DECIMALS),
            new anchor.BN(endTimestamp),
            new anchor.BN(winnerCount),
            new anchor.BN(rewardAmount),
            new anchor.BN(whitelisted),
            new anchor.BN(max),
            {
                accounts: {
                    admin: userAddress,
                    globalAuthority,
                    raffle,
                    ownerTempNftAccount: ownerNftAccount,
                    destNftTokenAccount: ix0.destinationAccounts[0],
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [],
                signers: [],
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        successAlert("Transaction confirmed!");
        closeLoading();
        updatePage();
    } catch (error) {
        console.log(error);
        closeLoading();
    }

}

/**
 * @dev BuyTicket function
 * @param userAddress The use's address
 * @param nft_mint The nft_mint address
 * @param amount The amount of ticket to buy
 */
export const buyTicket = async (
    wallet: WalletContextState,
    nft_mint: PublicKey,
    amount: number,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    const userAddress = wallet.publicKey;
    try {
        const [globalAuthority, bump] = await PublicKey.findProgramAddress(
            [Buffer.from(GLOBAL_AUTHORITY_SEED)],
            program.programId
        );
        const raffleKey = await getRaffleKey(nft_mint);
        if (raffleKey === null) return;
        let raffleState = await getRaffleState(nft_mint);
        if (raffleState === null) return;

        const creator = raffleState.creator;

        let userTokenAccount = await getAssociatedTokenAccount(userAddress, PREY_TOKEN_MINT);
        const tx = await program.rpc.buyTickets(
            bump,
            new anchor.BN(amount),
            {
                accounts: {
                    buyer: userAddress,
                    raffle: raffleKey,
                    globalAuthority,
                    creator,
                    tokenMint: PREY_TOKEN_MINT,
                    userTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                },
                instructions: [],
                signers: [],
            });
        await solConnection.confirmTransaction(tx, "finalized");
        successAlert("Transaction confirmed!");
        updatePage()
        console.log("txHash =", tx);
        closeLoading();

    } catch (error) {
        console.log(error);
        closeLoading();
    }

}

/**
 * @dev RevealWinner function
 * @param userAddress The user's address to call this function
 * @param nft_mint The nft_mint address
 */
export const revealWinner = async (
    wallet: WalletContextState,
    raffleKey: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    const userAddress = wallet.publicKey;
    try {
        const tx = await program.rpc.revealWinner(
            {
                accounts: {
                    buyer: userAddress,
                    raffle: raffleKey,
                },
                instructions: [],
                signers: [],
            });
        await solConnection.confirmTransaction(tx, "confirmed");
        successAlert("Transaction confirmed!");
        closeLoading();
        updatePage();

        console.log("txHash =", tx);
    } catch (error) {
        closeLoading();
        console.log(error)
    }
}

/**
 * @dev ClaimReward function
 * @param userAddress The winner's address
 * @param nft_mint The nft_mint address
 */
export const claimReward = async (
    wallet: WalletContextState,
    nft_mint: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    const userAddress = wallet.publicKey;
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const raffleKey = await getRaffleKey(nft_mint);
    if (raffleKey === null) return;
    const srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, nft_mint);

    let ix0 = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [nft_mint]
    );
    try {

        const srcPreyTokenAccount = await getAssociatedTokenAccount(globalAuthority, PREY_TOKEN_MINT);
        const claimerPreyTokenAccount = await getAssociatedTokenAccount(userAddress, PREY_TOKEN_MINT);

        let tx = new Transaction();
        tx.add(...ix0.instructions);
        tx.add(program.instruction.claimReward(
            bump,
            {
                accounts: {
                    claimer: userAddress,
                    globalAuthority,
                    raffle: raffleKey,
                    claimerNftTokenAccount: ix0.destinationAccounts[0],
                    srcNftTokenAccount,
                    srcPreyTokenAccount,
                    claimerPreyTokenAccount,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [],
                signers: [],
            }
        ))

        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        successAlert("Transaction confirmed!");
        closeLoading();
        updatePage();
        console.log("txHash =", tx);
    } catch (error) {
        closeLoading();
        console.log(error)
    }

}

/**
 * @dev WithdrawNFT function
 * @param userAddress The creator's address
 * @param nft_mint The nft_mint address
 */
export const withdrawNft = async (
    wallet: WalletContextState,
    nft_mint: PublicKey,
    startLoading: Function,
    closeLoading: Function,
    updatePage: Function
) => {
    if (wallet.publicKey === null) return;
    startLoading();
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    const userAddress = wallet.publicKey;
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    try {

        const raffleKey = await getRaffleKey(nft_mint);
        if (raffleKey === null) return;
        const srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, nft_mint);

        let ix0 = await getATokenAccountsNeedCreate(
            solConnection,
            userAddress,
            userAddress,
            [nft_mint]
        );
        console.log("Creator's NFT Account: ", ix0.destinationAccounts[0]);

        let tx = new Transaction();
        if (ix0.instructions.length !== 0)
            tx.add(...ix0.instructions);
        tx.add(program.instruction.withdrawNft(
            bump,
            {
                accounts: {
                    claimer: userAddress,
                    globalAuthority,
                    raffle: raffleKey,
                    claimerNftTokenAccount: ix0.destinationAccounts[0],
                    srcNftTokenAccount,
                    nftMintAddress: nft_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                instructions: [],
                signers: [],
            }
        ))
        const txId = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(txId, "finalized");
        successAlert("Transaction confirmed!");
        closeLoading();
        updatePage();
        console.log("txHash =", tx);
    } catch (error) {
        closeLoading();
        console.log(error)
    }
}


export const getRaffleKey = async (
    nft_mint: PublicKey
): Promise<PublicKey | null> => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
                },
                {
                    memcmp: {
                        "offset": 40,
                        "bytes": nft_mint.toBase58()
                    }
                }
            ]
        }
    );
    if (poolAccounts.length !== 0) {
        let len = poolAccounts.length;
        console.log(len);
        let max = 0;
        let maxId = 0;
        for (let i = 0; i < len; i++) {
            let state = await getStateByKey(poolAccounts[i].pubkey);
            if (state !== null && state.endTimestamp.toNumber() > max) {
                max = state.endTimestamp.toNumber();
                maxId = i;
            }
        }
        let raffleKey = poolAccounts[maxId].pubkey;
        return raffleKey;
    } else {
        return null;
    }
}

export const getRaffleGlobalState = async () => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
                },
            ]
        }
    );
    if (poolAccounts.length !== 0) {
        let len = poolAccounts.length;
        let list = [];
        for (let i = 0; i < len; i++) {
            let state = await getStateByKey(poolAccounts[i].pubkey);
            if (state)
                state.raffleKey = poolAccounts[i].pubkey.toBase58();
            list.push(state);
        }
        return list;
    } else {
        return null;
    }
}

export const getRaffleState = async (
    nft_mint: PublicKey
): Promise<RafflePool | null> => {

    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    let poolAccounts = await solConnection.getParsedProgramAccounts(
        program.programId,
        {
            filters: [
                {
                    dataSize: RAFFLE_SIZE
                },
                {
                    memcmp: {
                        "offset": 40,
                        "bytes": nft_mint.toBase58()
                    }
                }
            ]
        }
    );
    if (poolAccounts.length !== 0) {
        let rentalKey = poolAccounts[0].pubkey;

        try {
            let rentalState = await program.account.rafflePool.fetch(rentalKey);
            return rentalState as unknown as RafflePool;
        } catch {
            return null;
        }
    } else {
        return null;
    }
}
export const getStateByKey = async (
    raffleKey: PublicKey
): Promise<RafflePool | null> => {
    let cloneWindow: any = window;
    let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
    const program = new anchor.Program(IDL as anchor.Idl, PROGRAM_ID, provider);
    try {
        let rentalState = await program.account.rafflePool.fetch(raffleKey);
        return rentalState as unknown as RafflePool;
    } catch {
        return null;
    }
}

const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}

export const getATokenAccountsNeedCreate = async (
    connection: anchor.web3.Connection,
    walletAddress: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    nfts: anchor.web3.PublicKey[],
) => {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
        let response = await connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = createAssociatedTokenAccountInstruction(
                destinationPubkey,
                walletAddress,
                owner,
                mint,
            );
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
        if (walletAddress != owner) {
            const userAccount = await getAssociatedTokenAccount(walletAddress, mint);
            response = await connection.getAccountInfo(userAccount);
            if (!response) {
                const createATAIx = createAssociatedTokenAccountInstruction(
                    userAccount,
                    walletAddress,
                    walletAddress,
                    mint,
                );
                instructions.push(createATAIx);
            }
        }
    }
    return {
        instructions,
        destinationAccounts,
    };
}

export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    walletAddress: anchor.web3.PublicKey,
    splTokenMintAddress: anchor.web3.PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}