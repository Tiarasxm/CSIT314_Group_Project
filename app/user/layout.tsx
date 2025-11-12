import Sidebar from "@/components/ui/sidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="ml-64 min-h-screen overflow-y-auto">{children}</main>
    </div>
  );
}

