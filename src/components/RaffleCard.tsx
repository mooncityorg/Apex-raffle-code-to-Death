import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DECIMALS } from "../config";
import { getNftMetaData } from "../contexts/utils";
import { useRouter } from "next/router";
import Link from "next/link";
import Countdown from "./Countdown";
import { Skeleton } from "@mui/material";

export default function RaffleCard(props: {
  ticketPricePrey: number,
  ticketPriceSol: number,
  endTimestamp: number,
  ticketsCount: number,
  nftMint: string,
  raffleKey: string,
  maxEntrants: number,
}) {
  const { ticketPricePrey, ticketPriceSol, maxEntrants, raffleKey, endTimestamp, nftMint, ticketsCount } = props;
  const router = useRouter();
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [payType, setPayType] = useState("--");
  const [loading, setLoading] = useState(false);

  const getNFTdetail = async () => {
    setLoading(true);
    const uri = await getNftMetaData(new PublicKey(nftMint))
    await fetch(uri)
      .then(resp =>
        resp.json()
      ).then((json) => {
        setImage(json.image);
        setName(json.name);
        setDescription(json.description)

      })
      .catch((error) => {
        console.log(error)
      })
    if (ticketPricePrey === 0) {
      setPrice(ticketPriceSol / LAMPORTS_PER_SOL);
      setPayType("SOL");
    } else if (ticketPriceSol === 0) {
      setPrice(ticketPricePrey / DECIMALS);
      setPayType("$PREY")
    }

    setLoading(false);
  }
  useEffect(() => {
    getNFTdetail();
    // eslint-disable-next-line
  }, [])

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
    <div className="raffle-card" onClick={() => router.push("/raffle/" + raffleKey)}>
      <div className="media" ref={cardRef}>
        <img
          src={image}
          alt=""
          style={{
            filter: endTimestamp < new Date().getTime() ? "grayscale(1)" : "none"
          }}
        />

      </div>
      <div className="card-content">
        <div className="top-content">
          <h3 className="card-title title-1">{name}</h3>
          <p className="card-price">{price} {payType}</p>
          {/* <p className="card-total-item">Total item: <span>250</span></p> */}
          <div className="card-countdown">
            {endTimestamp > new Date().getTime() ?
              <>
                <p>End in:</p>
                <Countdown endDateTime={endTimestamp} update={() => getNFTdetail()} />
              </>
              :
              <>Closed</>
            }
          </div>
          <p className="card-total-item">{ticketsCount}/{maxEntrants} Filled</p>
          <p className="card-description">
            {description.slice(0, 120)}
            {description.length > 120 && "..."}
            {description.length > 120 &&
              <span>
                <Link href={"/raffle/" + raffleKey}>
                  <a>
                    Read more
                  </a>
                </Link>
              </span>
            }
          </p>
        </div>
        <div className="bottom-content">
          <p>not enough prey, hunt some
            <span>
              <Link href="https://">
                <a>
                  here
                </a>
              </Link>
            </span>.
          </p>
        </div>
      </div>
    </div>
  )
}