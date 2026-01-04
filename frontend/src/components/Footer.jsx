export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-6">
        <div>
          <h4 className="text-white font-semibold mb-2">PrimeCabs</h4>
          <p>Melbourne airport transfers 24/7.</p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Services</h4>
          <ul className="space-y-1">
            <li>Airport Transfers</li>
            <li>Maxi Taxi</li>
            <li>Corporate Travel</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Coverage</h4>
          <p>All Melbourne suburbs</p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Contact</h4>
          <p>Available 24/7</p>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4 text-center text-sm">
        © {new Date().getFullYear()} PrimeCabs. All rights reserved.
      </div>
    </footer>
  );
}
