import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';


const RideSuccessScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isGuest = location.state?.isGuest ?? false;

    useEffect(() => {
        const timeout = setTimeout(() => {
            navigate('/', {
                state: { nextMode: isGuest ? 'passenger' : 'myrides' },
            });
        }, 3000); // wait 3 seconds before redirect

        return () => clearTimeout(timeout);
    }, [isGuest, navigate]);

    return (
        <motion.div
            className="h-screen flex flex-col items-center justify-center text-center p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Helmet>
                <title>Thank You – Ride Booked | Express Cabs</title>
                <meta name="description" content="Your ride has been successfully booked with Express Cabs. We'll be in touch shortly with driver details." />
                <meta name="robots" content="noindex, nofollow" />

                {/* Global site tag (gtag.js) */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17249057389"></script>

                {/* Google Ads conversion event for Booking-Form-Submitted */}
                <script type="text/javascript">
                    {`
                     window.dataLayer = window.dataLayer || [];
                     function gtag(){dataLayer.push(arguments);}
                     gtag('js', new Date());
                     gtag('config', 'AW-17249057389');
                     gtag('event', 'conversion', {
                     send_to: 'AW-17249057389/OwxRCP63nOAaEO30_qBA',
                     value: 1.0,
                     currency: 'AUD'
                     });
                   `}
                </script>
            </Helmet>

            <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ delay: 0.3 }}
                className="text-6xl mb-4"
            >
                ✅
            </motion.div>

            <motion.h1
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                Ride Booked Successfully!
            </motion.h1>

            <motion.p
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                Redirecting you shortly...
            </motion.p>
        </motion.div>
    );
};

export default RideSuccessScreen;
