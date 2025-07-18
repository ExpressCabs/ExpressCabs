import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/adminSidebar";

export default function Dashboard() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-6 bg-white">
                <Outlet />
            </div>
        </div>
    );
}
