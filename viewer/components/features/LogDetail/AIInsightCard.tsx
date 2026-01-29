"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { Spinner } from "../../ui/Spinner";
import { AIInsight, FollowUpAction } from "@/types/log";
import { cn } from "../../../lib/utils";

export interface AIInsightCardProps {
  insight: AIInsight;
  isLoading?: boolean;
  onFollowUpClick?: (action: FollowUpAction) => void;
  className?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  isLoading = false,
  onFollowUpClick,
  className,
}) => {
  const [expandedFollowUp, setExpandedFollowUp] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "text-log-info border-log-info/40",
      medium: "text-log-warn border-log-warn/40",
      high: "text-log-error border-log-error/40",
      critical: "text-log-fatal border-log-fatal/40",
    };
    return colors[severity] || "text-terminal-muted border-terminal-border";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-log-info",
      medium: "text-log-warn",
      high: "text-log-error",
      critical: "text-log-fatal",
    };
    return colors[priority] || "text-terminal-muted";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      investigation: "🔍",
      fix: "🔧",
      monitor: "📊",
      documentation: "📝",
    };
    return icons[type] || "•";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      investigation: "text-log-info",
      fix: "text-log-warn",
      monitor: "text-log-info",
      documentation: "text-terminal-accent",
    };
    return colors[type] || "text-terminal-muted";
  };

  if (isLoading) {
    return (
      <Card
        variant="bordered"
        padding="lg"
        className={cn("min-h-100", className)}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Spinner variant="blocks" size="lg" text="ANALYZING LOG..." />
          <p className="text-terminal-muted text-sm font-mono">
            AI is processing the log entry...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="bordered"
      padding="none"
      className={cn("flex flex-col h-full", className)}
    >
      <CardHeader className="px-4 py-3 border-b border-terminal-border bg-linear-to-r from-terminal-input to-terminal-secondary">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-purple-400">[</span>
            <span className="text-purple-400">AI INSIGHT</span>
            <span className="text-purple-400">]</span>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              size="sm"
              className={cn("border", getSeverityColor(insight.severity))}
            >
              {insight.severity.toUpperCase()}
            </Badge>
            <Badge variant="terminal" size="sm">
              {insight.confidence}% CONFIDENCE
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-purple-400">[</span>
            <span>Summary</span>
            <span className="text-purple-400">]</span>
          </div>
          <div className="pl-3 border-l border-purple-400/30">
            <p className="text-sm text-text-primary font-mono leading-relaxed">
              {insight.summary}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-purple-400">[</span>
            <span>Root Cause</span>
            <span className="text-purple-400">]</span>
          </div>
          <div className="pl-3 border-l border-purple-400/30">
            <div className="bg-terminal-input/50 p-3 border border-purple-400/20 rounded">
              <p className="text-sm text-text-primary font-mono leading-relaxed">
                {insight.rootCause}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
            <span className="text-purple-400">[</span>
            <span>Suggested Follow-ups</span>
            <span className="text-purple-400">]</span>
          </div>
          <div className="space-y-2 pl-3 border-l border-purple-400/30">
            {insight.followUps.map((action) => (
              <div
                key={action.id}
                className="border border-terminal-border bg-terminal-input/30 hover:border-purple-400/50 hover:bg-terminal-input/50 transition-all duration-200"
              >
                <button
                  onClick={() => {
                    setExpandedFollowUp(
                      expandedFollowUp === action.id ? null : action.id,
                    );
                    onFollowUpClick?.(action);
                  }}
                  className="w-full text-left px-3 py-2"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "text-lg mt-0.5 shrink-0",
                        getTypeColor(action.type),
                      )}
                    >
                      {getTypeIcon(action.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-mono font-semibold text-text-primary truncate">
                          {action.title}
                        </h4>
                        <Badge
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-[10px] px-1.5 py-0.5",
                            getPriorityColor(action.priority),
                          )}
                        >
                          {action.priority.toUpperCase()}
                        </Badge>
                      </div>

                      {expandedFollowUp === action.id && (
                        <p className="text-xs text-text-secondary font-mono mt-2 leading-relaxed">
                          {action.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-terminal-muted text-xs font-mono transition-transform duration-200",
                        expandedFollowUp === action.id ? "rotate-90" : "",
                      )}
                    >
                      ▶
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {insight.patterns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
              <span className="text-purple-400">[</span>
              <span>Detected Patterns</span>
              <span className="text-purple-400">]</span>
            </div>
            <div className="flex flex-wrap gap-2 pl-3 border-l border-purple-400/30">
              {insight.patterns.map((pattern, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-purple-400 border-purple-400/40"
                >
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {insight.relatedLogs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted uppercase tracking-wider">
              <span className="text-purple-400">[</span>
              <span>Related Logs</span>
              <span className="text-purple-400">]</span>
            </div>
            <div className="pl-3 border-l border-purple-400/30">
              <div className="text-xs text-terminal-muted font-mono">
                {insight.relatedLogs.length} related log entries found
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <div className="px-4 py-2 border-t border-terminal-border bg-terminal-input/30 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-terminal-muted">Generated:</span>
          <span className="text-text-primary">
            {new Date(insight.createdAt).toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
        <div className="text-purple-400">
          <span className="animate-pulse">●</span> AI ANALYZED
        </div>
      </div>
    </Card>
  );
};

export default AIInsightCard;
