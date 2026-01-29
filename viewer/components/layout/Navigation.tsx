"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface NavigationProps {
  items: NavigationItem[];
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ items, className }) => {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-1", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              className={cn(
                "justify-start gap-2 font-mono",
                isActive && "terminal-glow",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" size="sm">
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
