import SidebarLayout from "@/components/layout/SidebarLayout"

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarLayout>{children}</SidebarLayout>
}
