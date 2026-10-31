import DocumentLayout from "@/app/_components/DocumentLayout";
import GoogleAdsTag from "@/components/GoogleAdsTag";

export { metadata } from "@/app/_components/DocumentLayout";

export default function VisitorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DocumentLayout headContent={<GoogleAdsTag />}>
      {children}
    </DocumentLayout>
  );
}
