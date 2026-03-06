import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import type React from "react";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
}

export default function PageHeader({
  title,
  icon,
  description,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-start justify-between mb-6"
      data-ocid="page_header.panel"
    >
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/" })}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-0 -ml-1 mb-1 w-fit"
          data-ocid="page_header.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          {icon && <span className="text-amber-500">{icon}</span>}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate({ to: "/" })}
        className="text-muted-foreground hover:text-foreground shrink-0"
        data-ocid="page_header.close_button"
        aria-label="Close and return to dashboard"
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
}
