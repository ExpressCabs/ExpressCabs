import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/adminSidebar";

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen flex bg-white">
            <AdminSidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
            />

            {sidebarOpen ? (
                <button
                    type="button"
                    aria-label="Close sidebar overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-slate-950/35 md:hidden"
                />
            ) : null}

            <div className="flex-1 min-w-0 bg-white">
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Dashboard</p>
                        <h1 className="text-lg font-bold text-slate-900">Operations Console</h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm md:hidden"
                    >
                        Menu
                    </button>
                </div>

                <div className="p-4 md:p-6">
                <Outlet />
                </div>
            </div>
        </div>
    );
}
