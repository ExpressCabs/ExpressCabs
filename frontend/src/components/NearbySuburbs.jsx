import { Link } from "react-router-dom";
import suburbs from "../data/melbourneSuburbs.json";

export default function NearbySuburbs({ suburb }) {
  const nearby = suburbs.filter((s) => suburb.nearby?.includes(s.slug));

  return (
    <section className="max-w-5xl mx-auto px-6 pb-14">
      <h3 className="text-xl font-bold mb-4">
        Airport Transfers near {suburb.name}
      </h3>

      {nearby.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {nearby.map((s) => (
            <Link
              key={s.slug}
              to={`/airport-transfer/melbourne/${s.slug}`}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              {s.name} ({s.postcode})
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-700">
          Browse more suburbs for airport transfers.
        </p>
      )}

      <Link
        to="/airport-transfer/melbourne"
        className="inline-block mt-6 px-5 py-3 rounded-lg bg-black text-white"
      >
        View all suburbs
      </Link>
    </section>
  );
}
