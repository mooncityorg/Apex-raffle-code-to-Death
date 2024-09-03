import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getNftMetaData } from "../../../contexts/utils";
import moment from "moment";
import { FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { createRaffle } from "../../../contexts/transaction";
import { errorAlert } from "../../../components/toastGroup";

export default function CreateNewRafflePage(props: {
  startLoading: Function,
  closeLoading: Function
}) {
  const { startLoading, closeLoading } = props;
  const router = useRouter();
  const wallet = useWallet();
  const { mint } = router.query;
  const [image, setImage] = useState("");
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [rewardPrice, setRewardPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("sol");
  const [rewardType, setRewardType] = useState("nft");

  const [winnerCount, setWinnerCount] = useState(1);
  const [price, setPrice] = useState();
  const [maxTickts, setMaxTickts] = useState();
  const [endTime, setEndTime] = useState(moment(new Date()).format());

  const getNFTdetail = async () => {
    startLoading()
    if (mint !== undefined) {
      const uri = await getNftMetaData(new PublicKey(mint))
      await fetch(uri)
        .then(resp =>
          resp.json()
        ).then((json) => {
          setImage(json.image)
          setNftName(json.name)
          setNftDescription(json.description)
        })
    }
    closeLoading();
  }

  const handlePayment = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod((event.target as HTMLInputElement).value);
  };

  const handleRewardType = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRewardType((event.target as HTMLInputElement).value);
  };

  const handleCreate = async () => {
    if (mint === undefined) return;
    if (checkValidate()) {
      let solPrice;
      let splPrice;
      if (paymentMethod === "sol") {
        solPrice = price;
        splPrice = 0
      } else if (paymentMethod === "spl") {
        solPrice = 0;
        splPrice = price
      }
      if (solPrice === undefined) return;
      if (splPrice === undefined) return;
      if (maxTickts === undefined) return;
      let winnerCnt = 1;
      let white = 0;
      if (rewardType === "nft") {
        white = 2;
        winnerCnt = 1;
      } else if (rewardType === "whitelist") {
        winnerCnt = winnerCount;
        white = 0;
      } else if (rewardType === "spl") {
        winnerCnt = winnerCount;
        white = 1;
      }

      try {
        await createRaffle(
          wallet,
          new PublicKey(mint),
          solPrice,
          splPrice,
          new Date(endTime).getTime() / 1000,
          rewardPrice,
          winnerCnt,
          white,
          maxTickts,
          () => startLoading(),
          () => closeLoading(),
          () => router.push("/raffle")
        )
      } catch (error) {
        console.log(error)
      }
    }

  }

  const checkValidate = () => {
    if (price === 0) {
      errorAlert("Please enter correct price");
      return false
    }
    const now = new Date();
    const end = new Date(endTime);
    if (now >= end) {
      errorAlert("Please enter correct end date");
      return false
    }
    if (rewardType === "whitelist" && (winnerCount === undefined || winnerCount === 0)) {
      errorAlert("Please enter the correct number of winners.");
      return false
    }
    if (maxTickts === undefined || maxTickts === 0) {
      errorAlert("Please enter the correct number of max tickets.");
      return false
    }
    return true;
  }

  useEffect(() => {
    getNFTdetail();
    // eslint-disable-next-line
  }, [wallet.connected])

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
                style={{ height: dimensions.width }}
                alt=""
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
            <div className="row">
              <div className="col-half">
                <div className="form-control">
                  <label>Choose payment method</label>
                  <FormControl>
                    <RadioGroup
                      row
                      onChange={handlePayment}
                      defaultValue="sol"
                    >
                      <FormControlLabel value="sol" control={<Radio />} label="SOL" />
                      <FormControlLabel value="spl" control={<Radio />} label="$PREY" />
                    </RadioGroup>
                  </FormControl>
                </div>
              </div>
              <div className="col-half">
                <div className="form-control">
                  <label>Price*</label>
                  <input
                    value={price}
                    name="price"
                    onChange={(e: any) => setPrice(e.target.value)}
                    placeholder="Please enter the NFT price"
                  />
                  <span className="token-name">
                    {
                      paymentMethod === "sol" ?
                        <>SOL</>
                        :
                        <>$PREY</>
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-half">
                <div className="form-control">
                  <label>Choose reward type</label>
                  <FormControl>
                    <RadioGroup
                      row
                      onChange={handleRewardType}
                      defaultValue="nft"
                    >
                      <FormControlLabel value="nft" control={<Radio />} label="NFT" />
                      <FormControlLabel value="whitelist" control={<Radio />} label="Whitelist" />
                      <FormControlLabel value="spl" control={<Radio />} label="PREY" />
                    </RadioGroup>
                  </FormControl>
                </div>
              </div>
            </div>
            <div className="row">
              {
                rewardType !== "nft" &&
                <div className="col-half">
                  <div className="form-control">
                    <label>Winner Count* (Maximum 50)</label>
                    <input
                      value={winnerCount}
                      name="winner-count"
                      onChange={(e: any) => setWinnerCount(e.target.value)}
                      placeholder="Please enter the winner count."
                    />
                  </div>
                </div>
              }
              {
                rewardType === "spl" &&
                <div className="col-half">
                  <div className="form-control">
                    <label>Reward Price ($PREY)</label>
                    <input
                      value={rewardPrice}
                      name="winner-count"
                      onChange={(e: any) => setRewardPrice(e.target.value)}
                      placeholder="Please enter the winner count."
                    />
                  </div>
                </div>
              }
            </div>
            <div className="row">
              <div className="col-half">
                <div className="form-control">
                  <label>End time*</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    name="end-time"
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="Please choose end time."
                  />
                </div>
              </div>
              <div className="col-half">
                <div className="form-control">
                  <label>Tickets* (Maximum 2000)</label>
                  <input
                    value={maxTickts}
                    name="max-tickets"
                    onChange={(e: any) => setMaxTickts(e.target.value)}
                    placeholder="Please enter the max tickets."
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-half">
                <button
                  className="btn-main mt-10"
                  onClick={() => handleCreate()}
                >
                  Create a raffle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
