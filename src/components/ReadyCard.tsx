import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";
import { getNftMetaData } from "../contexts/utils";

export default function ReadyCard(props: {
    mint: string
}) {
    const [image, setImage] = useState("");
    const [name, setName] = useState("");
    const router = useRouter();
    const getNFTdetail = async () => {
        const uri = await getNftMetaData(new PublicKey(props.mint))
        await fetch(uri)
            .then(resp =>
                resp.json()
            ).then((json) => {
                setImage(json.image);
                setName(json.name);
            })
            .catch((error) => {
                console.log(error)
            })
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
        <div className="ready-card">
            <div className="card-media" ref={cardRef}>
                {/* eslint-disable-next-line */}
                <img
                    src={image}
                    alt=""
                    style={{ height: dimensions.width }}
                />
            </div>
            <p>{name}</p>
            <button className="btn-primary" onClick={() => router.push(`/raffle/new/${props.mint}`)}>
                Create Raffle
            </button>
        </div>
    )
}