import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
    { to: "/admin/analytics", label: "Analytics", short: "A" },
    { to: "/admin/rides", label: "Ride Management", short: "R" },
    { to: "/admin/invite-driver", label: "Drivers", short: "D" },
    { to: "/admin/blogs", label: "All Blogs", short: "B" },
    { to: "/admin/blogs/new", label: "Write Blog", short: "W" },
    { to: "/admin/email", label: "Send Email", short: "E" },
];

export default function AdminSidebar({
    isOpen = false,
    isCollapsed = false,
    onClose,
    onToggleCollapse,
}) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("admin");
        navigate("/admin/login");
    };

    return (
        <aside
            className={[
                "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 md:sticky md:top-0 md:h-screen",
                isCollapsed ? "w-[88px]" : "w-[280px]",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            ].join(" ")}
        >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div className={isCollapsed ? "mx-auto" : ""}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {isCollapsed ? "EC" : "Express Cabs"}
                    </p>
                    {!isCollapsed ? (
                        <h2 className="mt-1 text-lg font-bold text-slate-900">Admin Panel</h2>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="hidden rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm md:inline-flex"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? ">" : "<"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm md:hidden"
                    >
                        Close
                    </button>
                </div>
            </div>

            <nav className="flex-1 space-y-2 px-3 py-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            [
                                "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                                isActive
                                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                    : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
                                isCollapsed ? "justify-center px-2" : "",
                            ].join(" ")
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    className={[
                                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                                        isActive
                                            ? "bg-white/15 text-white"
                                            : "bg-slate-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white",
                                    ].join(" ")}
                                >
                                    {item.short}
                                </span>
                                {!isCollapsed ? <span>{item.label}</span> : null}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-slate-200 px-3 py-4">
                <button
                    onClick={handleLogout}
                    className={[
                        "flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100",
                        isCollapsed ? "justify-center px-2" : "",
                    ].join(" ")}
                >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-xs font-bold text-red-600">
                        X
                    </span>
                    {!isCollapsed ? <span>Logout</span> : null}
                </button>
            </div>
        </aside>
    );
}
