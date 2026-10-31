import DocumentLayout from "@/app/_components/DocumentLayout";

export { metadata } from "@/app/_components/DocumentLayout";

export default function ManagementLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DocumentLayout>{children}</DocumentLayout>;
}
