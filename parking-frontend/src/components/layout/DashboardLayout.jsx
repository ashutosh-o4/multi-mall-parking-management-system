import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function DashboardLayout({ title, children }) {
  return (
    <div>
      <Sidebar />
      <Navbar title={title} />
      <main
        style={{
          marginLeft: "240px",
          marginTop: "60px",
          padding: "32px",
          minHeight: "calc(100vh - 60px)",
          backgroundColor: "var(--bg-primary)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}
