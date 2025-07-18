import { Navigate, useLocation } from 'react-router-dom';

const RequireAdmin = ({ children }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAdmin;
