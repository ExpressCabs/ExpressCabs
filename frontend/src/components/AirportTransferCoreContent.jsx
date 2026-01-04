export default function AirportTransferCoreContent({ suburb }) {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* About the service */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">
          Reliable Airport Transfers from {suburb.name}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          PrimeCabs offers safe, comfortable and on-time airport transfers from{" "}
          <strong>{suburb.name}</strong> to Melbourne Airport. Whether you’re travelling
          for business or a family trip, we provide 24/7 pickups with fixed pricing
          and professional local drivers.
        </p>
      </section>

      {/* Benefits */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Why choose PrimeCabs?</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>Fixed pricing — no surge fares</li>
          <li>24/7 airport transfers including early morning pickups</li>
          <li>Flight tracking to adjust for delays</li>
          <li>Door-to-door pickups in {suburb.name} ({suburb.postcode})</li>
          <li>Professional drivers and clean vehicles</li>
        </ul>
      </section>

      {/* How it works */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">How to book</h2>
        <ol className="list-decimal ml-6 text-gray-700 space-y-1">
          <li>Enter your pickup location in {suburb.name}</li>
          <li>Select Melbourne Airport as your destination</li>
          <li>Choose your vehicle and confirm your trip</li>
        </ol>
      </section>

      {/* Pricing / transparency */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Transparent pricing</h2>
        <p className="text-gray-700 leading-relaxed">
          We aim to keep pricing clear and predictable. Your quote depends on pickup
          address, time, and vehicle type. No hidden charges — just reliable airport transport.
        </p>
      </section>

      {/* Trust */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Trusted local service</h2>
        <p className="text-gray-700 leading-relaxed">
          PrimeCabs provides airport transfers across Melbourne suburbs with punctual
          drivers and a customer-first approach. If you need help, we’re available 24/7.
        </p>
      </section>
    </section>
  );
}
