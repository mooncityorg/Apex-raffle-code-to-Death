import { useEffect, useState } from "react";
import { getRaffleGlobalState } from "../contexts/transaction";
import RaffleCard from "./RaffleCard";

export default function RaffleList() {
    const [tab, setTab] = useState("live");
    const [liveRaffleList, setLiveRaffleList] = useState<any>();
    const [endRaffleList, setEndRaffleList] = useState<any>();

    const getRaffleList = async () => {
        const res = await getRaffleGlobalState();
        if (res !== undefined && res !== null && res?.length !== 0) {
            let liveList = [];
            let endList = [];
            for (let nft of res) {
                if (nft !== null) {
                    const ticketPricePrey = nft.ticketPricePrey.toNumber();
                    const ticketPriceSol = nft.ticketPriceSol.toNumber();
                    const endTimestamp = nft.endTimestamp.toNumber() * 1000;
                    const nftMint = nft.nftMint.toBase58();
                    const count = nft.count.toNumber();
                    const maxEntrants = nft.maxEntrants.toNumber();
                    if (new Date(nft.endTimestamp.toNumber() * 1000) > new Date()) {
                        liveList.push({
                            ticketPricePrey: ticketPricePrey,
                            ticketPriceSol: ticketPriceSol,
                            endTimestamp: endTimestamp,
                            nftMint: nftMint,
                            raffleKey: nft.raffleKey,
                            ticketsCount: count,
                            maxEntrants: maxEntrants
                        })
                    } else {
                        endList.push({
                            ticketPricePrey: ticketPricePrey,
                            ticketPriceSol: ticketPriceSol,
                            endTimestamp: endTimestamp,
                            raffleKey: nft.raffleKey,
                            nftMint: nftMint,
                            ticketsCount: count,
                            maxEntrants: maxEntrants
                        })
                    }
                }
            }
            liveList.sort((a, b) => b.endTimestamp - a.endTimestamp);
            endList.sort((a, b) => b.endTimestamp - a.endTimestamp);
            setLiveRaffleList(liveList);
            setEndRaffleList(endList);
        }
    }

    useEffect(() => {
        getRaffleList();
        // eslint-disable-next-line
    }, [])

    return (
        <div className="container pb-80">
            <div className="main-content">
                {/* <div className="page-tabs">
                    <button className="btn-image btn-tab" style={{ marginRight: 20 }} onClick={() => setTab("live")}>
                        live
                    </button>
                    <button className="btn-image btn-tab" onClick={() => setTab("ended")}>
                        all
                    </button>
                </div> */}
                <div className="raffle-list">
                    {liveRaffleList !== undefined && liveRaffleList.length !== 0 &&
                        liveRaffleList.map((item: any, key: number) => (
                            tab === "live" &&
                            <RaffleCard
                                key={key}
                                ticketPricePrey={item.ticketPricePrey}
                                ticketPriceSol={item.ticketPriceSol}
                                endTimestamp={item.endTimestamp}
                                nftMint={item.nftMint}
                                raffleKey={item.raffleKey}
                                maxEntrants={item.maxEntrants}
                                ticketsCount={item.ticketsCount}
                            />
                        ))
                    }
                    {endRaffleList !== undefined && endRaffleList.length !== 0 &&
                        endRaffleList.map((item: any, key: number) => (
                            tab === "live" &&
                            <RaffleCard
                                key={key}
                                ticketPricePrey={item.ticketPricePrey}
                                ticketPriceSol={item.ticketPriceSol}
                                endTimestamp={item.endTimestamp}
                                raffleKey={item.raffleKey}
                                nftMint={item.nftMint}
                                maxEntrants={item.maxEntrants}
                                ticketsCount={item.ticketsCount}
                            />
                        ))
                    }
                </div>
            </div>
        </div >
    )
}