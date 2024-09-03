import { PublicKey } from "@solana/web3.js";
import { web3 } from '@project-serum/anchor';
import { programs } from "@metaplex/js";
import { ADMINS, NETWORK } from "../config";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const adminValidation = (wallet: WalletContextState) => {
    let res = false;
    if (wallet.publicKey === null) return false;
    const address = wallet.publicKey;
    for (let item of ADMINS) {
        res = res || (item.address === address.toBase58())
    }
    return res
}

export const solConnection = new web3.Connection(web3.clusterApiUrl(NETWORK));

export const getNftMetaData = async (nftMintPk: PublicKey) => {
    let { metadata: { Metadata } } = programs;
    let metadataAccount = await Metadata.getPDA(nftMintPk);
    const metadata = await Metadata.load(solConnection, metadataAccount);
    return metadata.data.data.uri;
}