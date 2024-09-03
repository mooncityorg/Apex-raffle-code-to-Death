import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import HeroBanner from "../components/HeroBanner";
const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/raffle")
    // eslint-disable-next-line
  }, [])
  return (
    <main>
      <HeroBanner />
    </main>
  )
}

export default Home
