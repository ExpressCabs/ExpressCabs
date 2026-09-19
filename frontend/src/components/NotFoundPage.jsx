import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <Helmet>
        <title>Page Not Found | Prime Cabs Melbourne</title>
        <meta
          name="description"
          content="The requested Prime Cabs Melbourne page could not be found."
        />
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta name="googlebot" content="noindex,nofollow,noarchive" />
      </Helmet>

      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">404</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
        We could not find that page
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
        The address may be outdated or mistyped. You can return to booking or browse our airport taxi services.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 font-bold text-white hover:bg-black"
        >
          Book a ride
        </Link>
        <Link
          to="/services"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 font-bold text-slate-900 hover:bg-slate-50"
        >
          View services
        </Link>
      </div>
    </main>
  );
}
