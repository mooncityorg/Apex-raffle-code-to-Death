import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import { MetadataKey } from "@nfteyez/sol-rayz/dist/config/metaplex";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react"
import ReadyCard from "../components/ReadyCard";
import { solConnection } from "../contexts/utils";

export default function CreateRaffle(props: { startLoading: Function, closeLoading: Function }) {
    const { startLoading, closeLoading } = props;

    const wallet = useWallet()
    const [hide, setHide] = useState(false);
    const [nftList, setNftList] = useState<any>();

    const getNFTs = async () => {
        startLoading(true);
        if (wallet.publicKey !== null) {
            const nftsList = await getParsedNftAccountsByOwner({ publicAddress: wallet.publicKey.toBase58(), connection: solConnection });
            setNftList(nftsList);
            setHide(!hide);
            closeLoading(false);
        }
    }

    useEffect(() => {
        if (wallet.publicKey !== null) {
            getNFTs();
        } else {
            setNftList([])
        }
        // eslint-disable-next-line
    }, [wallet.connected]);
    return (
        <main>
            <div className="container">
                <div className="p-100">
                    <div className="create-list">
                        {nftList && nftList.length !== 0 &&
                            nftList.map((item: NFTType, key: number) => (
                                <ReadyCard
                                    mint={item.mint}
                                    key={key}
                                />
                            ))
                        }
                        {nftList && nftList.length === 0 &&
                            <p className="empty-wallet">No NFTs in this wallet</p>
                        }
                    </div>
                </div>
            </div>
        </main>
    )
}


interface NFTType {
    mint: string;
    updateAuthority: string;
    data: {
        creators: any[];
        name: string;
        symbol: string;
        uri: string;
        sellerFeeBasisPoints: number;
    };
    key: MetadataKey;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number;
    masterEdition?: string;
    edition?: string;
}