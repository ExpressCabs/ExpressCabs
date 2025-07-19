import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('admin');
        navigate('/admin/login');
    };

    return (
        <div className="bg-gray-100 p-4 md:w-64">
            <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
            <nav className="flex flex-col gap-3">
                <NavLink to="/admin/invite-driver" className="hover:underline">Invite Driver</NavLink>
                <NavLink to="/admin/blogs" className="hover:underline">All Blogs</NavLink>
                <NavLink to="/admin/blogs/new" className="hover:underline">Write Blog</NavLink>
                <NavLink to="/admin/email" className="hover:underline">Send Email</NavLink>
                <button
                    onClick={handleLogout}
                    className="text-left text-red-600 hover:underline mt-4"
                >
                    Logout
                </button>
            </nav>
        </div>
    );
}
