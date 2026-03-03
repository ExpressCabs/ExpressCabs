import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import suburbs from "../data/melbourneSuburbs.json";
import Footer from "../components/Footer";

export default function AirportTransfersMelbourne() {
  return (
    <>
      <Helmet>
        <title>Melbourne Airport Transfers by Suburb | Prime Cabs Melbourne</title>
        <meta
          name="description"
          content="Browse all Melbourne suburbs for airport transfer taxi bookings. Reliable pickups, fixed fares, and 24/7 availability."
        />
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/airport-transfer/melbourne" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">Melbourne Airport Transfers by Suburb</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {suburbs.map(s => (
            <Link
              key={s.slug}
              to={`/airport-transfer/melbourne/${s.slug}`}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              {s.name} ({s.postcode})
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}
