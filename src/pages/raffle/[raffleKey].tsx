import { ClickAwayListener } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import CopyAddress from "../../components/CopyAddress";
import Countdown from "../../components/Countdown";
import { DECIMALS } from "../../config";
import { buyTicket, claimReward, getRaffleState, getStateByKey, revealWinner, withdrawNft } from "../../contexts/transaction";
import { adminValidation, getNftMetaData } from "../../contexts/utils";

export default function RaffleItemPage(props: {
  startLoading: Function,
  closeLoading: Function
}) {
  const { startLoading, closeLoading } = props;
  const router = useRouter();
  const { raffleKey } = router.query;
  const [mint, setMint] = useState("");
  const wallet = useWallet();
  const [image, setImage] = useState("");
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [myTickets, setMyTickets] = useState<any>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [count, setCount] = useState(0);
  const [endTimestamp, setEndtimestamp] = useState(0);
  const [maxEntrants, setMaxEntrants] = useState(0);
  const [price, setPrice] = useState(0);
  const [payType, setPayType] = useState("SOL");
  const [whitelisted, setWhitelisted] = useState<any>();
  const [winner, setWinner] = useState<any>();
  const [winnerCount, setWinnerCount] = useState(0);

  const [tickets, setTickets] = useState(1);

  const [isRevealed, setIsRevealed] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isTicketsView, setIsTicketsView] = useState(false);

  const getRaffleData = async () => {
    console.log(raffleKey, "raffleKey")
    if (raffleKey === undefined) return;
    try {
      const raffle = await getStateByKey(new PublicKey(raffleKey));
      if (raffle !== null) {
        const nftMint = raffle.nftMint.toBase58();
        setMint(nftMint);
        getNFTdetail(nftMint);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getNFTdetail = async (nftMint: string) => {
    startLoading()
    if (raffleKey !== undefined) {
      const uri = await getNftMetaData(new PublicKey(nftMint))
      await fetch(uri)
        .then(resp =>
          resp.json()
        ).then((json) => {
          setImage(json.image)
          setNftName(json.name)
          setNftDescription(json.description)
        })
      const raffleData = await getRaffleState(new PublicKey(nftMint));
      if (raffleData === null) return;

      const tickets = raffleData?.count.toNumber();
      setCount(tickets);
      const end = raffleData.endTimestamp.toNumber() * 1000;
      setEndtimestamp(end);
      const wl = raffleData.whitelisted.toNumber();
      setWhitelisted(wl);
      if (raffleData.ticketPricePrey.toNumber() === 0) {
        setPrice(raffleData.ticketPriceSol.toNumber() / LAMPORTS_PER_SOL);
        setPayType("SOL");
      } else if (raffleData.ticketPriceSol.toNumber() === 0) {
        setPrice(raffleData.ticketPricePrey.toNumber() / DECIMALS);
        setPayType("$PREY");
      } let mine: any = [];
      for (let i = 0; i < tickets; i++) {
        if (raffleData.entrants[i].toBase58() === wallet.publicKey?.toBase58()) {
          mine.push({
            index: i + 1
          })
        }
      }
      setMyTickets(mine)
      const maxTickets = raffleData.maxEntrants.toNumber();
      setMaxEntrants(maxTickets);
      const winnerCnt = raffleData.winnerCount.toNumber();
      setWinnerCount(winnerCnt);
      console.log(tickets, winnerCnt, "thishtis")

      if (raffleData.winner[0].toBase58() === "11111111111111111111111111111111") {
        setIsRevealed(false);
      } else {
        setIsRevealed(true);
      }

      let winners = [];
      const resWinners = raffleData.winner;
      console.log(raffleData, "raffleData")
      const claimedWinner = raffleData.claimedWinner;
      for (let i = 0; i < winnerCnt; i++) {
        winners.push({
          address: resWinners[i].toBase58(),
          index: raffleData.indexes[i].toNumber(),
          claimed: claimedWinner[i].toNumber()
        }
        );

        if (resWinners[i].toBase58() === wallet.publicKey?.toBase58() && claimedWinner[i].toNumber() === 1) {
          setIsClaimed(true);
        }

        if (wallet.publicKey !== null) {
          if (resWinners[i].toBase58() === wallet.publicKey?.toBase58())
            setIsWinner(true);
        }
      }
      setWinner(winners);
    }
    closeLoading();
  }

  const handleReClaim = async () => {
    if (mint !== "") {
      try {
        await withdrawNft(
          wallet,
          new PublicKey(mint),
          () => startLoading(),
          () => closeLoading(),
          () => router.push("/create-raffle")
        )
      } catch (error) {
        console.log(error)
      }
    }
  }

  const handlePurchase = async () => {
    if (mint !== "")
      try {
        await buyTicket(
          wallet,
          new PublicKey(mint),
          tickets,
          () => startLoading(),
          () => closeLoading(),
          () => getNFTdetail(mint)
        )
      } catch (error) {
        console.log(error)
      }
  }

  const handleRevealWinner = async () => {
    if (raffleKey)
      try {
        await revealWinner(
          wallet,
          new PublicKey(raffleKey),
          () => startLoading(),
          () => closeLoading(),
          () => getNFTdetail(mint)
        )
      } catch (error) {
        console.log(error)
      }
  }

  const handleClaim = async () => {
    if (mint !== "")
      try {
        await claimReward(
          wallet,
          new PublicKey(mint),
          () => startLoading(),
          () => closeLoading(),
          () => getNFTdetail(mint)
        )
      } catch (error) {
        console.log(error)
      }
  }

  useEffect(() => {
    if (wallet.publicKey !== null) {
      const admin = adminValidation(wallet);
      setIsAdmin(admin)
    }
    // eslint-disable-next-line
  }, [wallet.connected, router]);

  useEffect(() => {
    if (raffleKey !== undefined)
      getRaffleData();
    // eslint-disable-next-line
  }, [wallet.connected, router]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (cardRef.current) {
      setDimensions({
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight
      });
    }
  }, []);

  return (
    <main>
      <div className="container">
        <div className="create-content">
          <div className="nft-info">
            <div className="media" ref={cardRef}>
              {/* eslint-disable-next-line */}
              <img
                src={image}
                alt=""
                style={{ height: dimensions.width }}
              />
            </div>
            <div className="info-item">
              <label>Name: </label>
              <h2>{nftName}</h2>
            </div>
            <div className="info-item">
              <label>Description: </label>
              <p className="description">{nftDescription}</p>
            </div>
          </div>

          <div className="create-panel">
            <div className="row m-20">
              <div className="col-12">
                <div className="raffle-info-item">
                  <label>Price</label>
                  <p className="text-1">{price} {payType}</p>
                </div>
              </div>
            </div>
            <div className="row m-20">
              <div className="col-half">
                <div className="raffle-info-item">
                  <label>Sold tickets</label>
                  {isRevealed ?
                    <p className="text-2">{count} / {maxEntrants}</p>
                    :
                    <p className="text-2">{count} / {maxEntrants}</p>
                  }
                </div>
              </div>
              {wallet.publicKey !== null &&
                <div className="col-half">
                  <div className="raffle-info-item">
                    <label>My tickets</label>
                    <div className="text-2 my-tickets">
                      <span>
                        {myTickets.length}
                      </span>
                      {myTickets.length !== 0 &&
                        <span className="view-tickets" onClick={() => setIsTicketsView(!isTicketsView)}>
                          {!isTicketsView ? "view" : "close"}
                        </span>
                      }
                      {isTicketsView &&
                        <ClickAwayListener onClickAway={() => setIsTicketsView(false)}>
                          <div className="my-tickets-content">
                            <ul>
                              {myTickets.length !== 0 && myTickets.map((item: any, key: number) => (
                                <li key={key}>
                                  #{item.index}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </ClickAwayListener>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
            <div className="row m-20">
              {winnerCount !== 1 &&
                <div className="col-half">
                  <div className="raffle-info-item">
                    <label>Whitelist Spots</label>
                    <p className="text-2">{winnerCount}</p>
                  </div>
                </div>
              }
              <div className="col-half">
                <div className="raffle-info-item">
                  <label>Raffle Ends</label>
                  {new Date() > new Date(endTimestamp) ?
                    <p className="text-2">
                      Closed
                    </p>
                    :
                    <p className="text-2">
                      <Countdown endDateTime={new Date(endTimestamp)} update={() => getNFTdetail(mint)} />
                    </p>
                  }
                </div>
              </div>
            </div>
            {wallet.publicKey === null ?
              <p className="wallet-alert">Please connect wallet</p>
              :
              <>
                {!isAdmin && new Date(endTimestamp) > new Date() &&
                  <div className="row m-20">
                    <div className="col-half">
                      <div className="form-control">
                        <label>Tickets to buy*</label>
                        <input
                          type="number"
                          value={tickets}
                          name="end-time"
                          min={1}
                          max={maxEntrants - count}
                          onChange={(e: any) => setTickets(e.target.value)}
                          placeholder="Please choose end time."
                        />
                        <p>You have to pay {price * tickets} {payType}.</p>
                      </div>
                    </div>
                  </div>
                }
                <div className="row m-10">
                  <div className="col-12">
                    {isAdmin ?
                      <>
                        {/* Reclaim nft when after endtime && no any tickets count  */}
                        {new Date(endTimestamp) < new Date() && whitelisted !== 3 && count === 0 && !isRevealed ?
                          <button className="btn-create-aution" onClick={() => handleReClaim()}>
                            Reclaim
                          </button>
                          :
                          <></>
                        }
                      </>
                      :
                      // On user side
                      (
                        // Before end time
                        new Date(endTimestamp) > new Date() ?
                          <button className="btn-create-aution" onClick={() => handlePurchase()}>
                            purchase ticket
                          </button>

                          :

                          // After end time
                          (
                            // if is revealed winners
                            !isRevealed ?
                              <>
                                {count !== 0 &&
                                  <>
                                    <p className="reveal-alert">You cannot see the winners at this time. You must pay a transaction fee to see the winner.</p>
                                    <button className="btn-create-aution" onClick={() => handleRevealWinner()}>
                                      view winners
                                    </button>
                                  </>
                                }
                              </>
                              :
                              // else is revealed winners
                              (!isClaimed && isWinner) ?
                                <button className="btn-create-aution" onClick={() => handleClaim()}>
                                  claim
                                </button>
                                :
                                <></>
                          )
                      )
                    }
                  </div>
                </div>
              </>
            }
            {winnerCount !== 0 && isRevealed &&
              <div className="row m-10">
                <div className="col-12">
                  <div className="winner-list">
                    <div className="winner-content">
                      <>
                        {whitelisted === 0 ?
                          <p className="text-1">Winner List</p>
                          :
                          <></>
                        }
                        {whitelisted === 1 ?
                          <p className="text-2">Winner</p>
                          :
                          <></>
                        }
                      </>
                      {winner && winner.length !== 0 && winner.map((item: any, key: number) => (
                        <div className="winner-item" key={key}>

                          <CopyAddress address={item.address} />
                          <span className="winner-claimed">
                            #&nbsp;{item.index}
                          </span>
                          <span className="winner-claimed">
                            {item.claimed === 1 ? "Claimed" : "---"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </main >
  )
}
