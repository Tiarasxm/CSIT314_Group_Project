import CSRSidebar from "@/components/ui/csr-sidebar";

export default function CSRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <CSRSidebar />
      <main className="ml-64 min-h-screen overflow-y-auto">{children}</main>
    </div>
  );
}

