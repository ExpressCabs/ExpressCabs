import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import suburbs from "../data/melbourneSuburbs.json";

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
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Service area</p>
          <h1 className="mt-3 text-4xl font-bold">Melbourne Airport Transfers by Suburb</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Find your pickup suburb, then use the booking form to enter the exact address, travel time,
            passenger count and vehicle choice. Add flight or luggage details in the booking notes when they
            are relevant to your trip.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            If your pickup is outside the listed area, contact us before booking so the trip details can be checked.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {suburbs.map(s => (
            <Link
              key={s.slug}
              to={`/airport-transfer/melbourne/${s.slug}`}
              rel={s?.seo?.indexable === true ? undefined : "nofollow"}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              {s.name} ({s.postcode})
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
