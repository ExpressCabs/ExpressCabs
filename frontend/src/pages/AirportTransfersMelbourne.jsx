import { Link } from "react-router-dom";
import suburbs from "../data/melbourneSuburbs.json";
import Footer from "../components/Footer";

export default function AirportTransfersMelbourne() {
  return (
    <>
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
