
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAdmin({ children, admin }) {
    const location = useLocation();

    if (!admin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
}
