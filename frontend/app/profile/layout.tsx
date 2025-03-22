import SidebarLayout from "@/components/layout/SidebarLayout"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarLayout>{children}</SidebarLayout>
}
