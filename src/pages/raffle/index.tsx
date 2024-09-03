import type { NextPage } from "next";
import RaffleList from "../../components/RaffleList";
import HeroBanner from "../../components/HeroBanner";
const RafflePage: NextPage = () => {
    return (
        <main>
            <HeroBanner />
            <RaffleList />
        </main>
    )
}

export default RafflePage
