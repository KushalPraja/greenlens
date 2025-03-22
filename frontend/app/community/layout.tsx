import SidebarLayout from "@/components/layout/SidebarLayout"

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarLayout>{children}</SidebarLayout>
}
