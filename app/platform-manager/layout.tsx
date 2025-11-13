import PlatformManagerSidebar from "@/components/ui/platform-manager-sidebar";

export default function PlatformManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <PlatformManagerSidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50">{children}</main>
    </div>
  );
}
