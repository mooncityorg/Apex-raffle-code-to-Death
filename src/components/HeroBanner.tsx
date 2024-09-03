import Link from "next/link"

export default function HeroBanner() {
    return (
        <div className="hero-banner">
            <Link href="/">
                <a>
                    <div className="hero-media">
                        {/* eslint-disable-next-line */}
                        <img
                            src="/img/hero-banner.png"
                            alt=""
                        />
                    </div>
                </a>
            </Link>
        </div>
    )
}