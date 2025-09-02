import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
interface PageLayoutProps {
  pageTitle: string;
  showBack?: boolean;
  showSettings?: boolean;
  children: ReactNode;
}
export function PageLayout({
  pageTitle,
  showBack = true,
  showSettings = true,
  children
}: PageLayoutProps) {
  const navigate = useNavigate();
  return <>
      <Header title="" showSettings={showSettings} />

      

      {children}
    </>;
}