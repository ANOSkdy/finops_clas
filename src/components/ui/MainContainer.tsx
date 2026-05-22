import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type MainContainerProps = {
  children: ReactNode;
  className?: string;
};

export function MainContainer({ children, className }: MainContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[940px] px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}
