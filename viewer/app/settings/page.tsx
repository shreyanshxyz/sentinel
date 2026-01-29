"use client";

import React, { useState } from "react";
import { Header } from "../../components/layout/Header";
import { Navigation } from "../../components/layout/Navigation";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Checkbox } from "../../components/ui/Checkbox";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

interface SettingsState {
  theme: "dark" | "light" | "system";
  fontSize: "small" | "medium" | "large";
  lineHeight: "compact" | "normal" | "relaxed";
  timestampFormat: "iso" | "local" | "relative";
  showMilliseconds: boolean;
  colorizeLogs: boolean;

  apiEndpoint: string;
  wsEndpoint: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;

  maxLogsInMemory: number;
  autoCleanup: boolean;
  cleanupInterval: number;
  persistFilters: boolean;

  enableNotifications: boolean;
  notifyOnError: boolean;
  notifyOnFatal: boolean;

  shortcuts: {
    pause: string;
    clear: string;
    search: string;
    settings: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    theme: "dark",
    fontSize: "medium",
    lineHeight: "normal",
    timestampFormat: "local",
    showMilliseconds: true,
    colorizeLogs: true,
    apiEndpoint: "http://localhost:8080/api",
    wsEndpoint: "ws://localhost:8080/ws",
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    maxLogsInMemory: 10000,
    autoCleanup: true,
    cleanupInterval: 300,
    persistFilters: true,
    enableNotifications: false,
    notifyOnError: true,
    notifyOnFatal: true,
    shortcuts: {
      pause: "Space",
      clear: "Ctrl+K",
      search: "Ctrl+F",
      settings: "Ctrl+,",
    },
  });

  const [activeSection, setActiveSection] = useState<string>("display");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const navigationItems = [
    { label: "Live Feed", href: "/" },
    { label: "Search", href: "/search" },
    { label: "Analytics", href: "/analytics" },
    { label: "Settings", href: "/settings", badge: "CONFIG" },
  ];

  const handleSettingChange = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaveStatus("saved");
    setHasChanges(false);
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      setSettings({
        theme: "dark",
        fontSize: "medium",
        lineHeight: "normal",
        timestampFormat: "local",
        showMilliseconds: true,
        colorizeLogs: true,
        apiEndpoint: "http://localhost:8080/api",
        wsEndpoint: "ws://localhost:8080/ws",
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        maxLogsInMemory: 10000,
        autoCleanup: true,
        cleanupInterval: 300,
        persistFilters: true,
        enableNotifications: false,
        notifyOnError: true,
        notifyOnFatal: true,
        shortcuts: {
          pause: "Space",
          clear: "Ctrl+K",
          search: "Ctrl+F",
          settings: "Ctrl+,",
        },
      });
      setHasChanges(true);
    }
  };

  const sections = [
    { id: "display", label: "DISPLAY", icon: "◈" },
    { id: "connection", label: "CONNECTION", icon: "◉" },
    { id: "data", label: "DATA", icon: "◆" },
    { id: "notifications", label: "NOTIFICATIONS", icon: "◐" },
    { id: "shortcuts", label: "KEYBOARD", icon: "⌘" },
    { id: "about", label: "ABOUT", icon: "ℹ" },
  ];

  const themeOptions = [
    { value: "dark", label: "Dark (Terminal)" },
    { value: "light", label: "Light" },
    { value: "system", label: "System Default" },
  ];

  const fontSizeOptions = [
    { value: "small", label: "Small (12px)" },
    { value: "medium", label: "Medium (14px)" },
    { value: "large", label: "Large (16px)" },
  ];

  const lineHeightOptions = [
    { value: "compact", label: "Compact (1.2)" },
    { value: "normal", label: "Normal (1.5)" },
    { value: "relaxed", label: "Relaxed (1.8)" },
  ];

  const timestampOptions = [
    { value: "iso", label: "ISO 8601" },
    { value: "local", label: "Local Time" },
    { value: "relative", label: "Relative (e.g., 2m ago)" },
  ];

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Select
          label="Theme"
          options={themeOptions}
          value={settings.theme}
          onChange={(value) =>
            handleSettingChange("theme", value as SettingsState["theme"])
          }
          variant="terminal"
        />
        <Select
          label="Font Size"
          options={fontSizeOptions}
          value={settings.fontSize}
          onChange={(value) =>
            handleSettingChange("fontSize", value as SettingsState["fontSize"])
          }
          variant="terminal"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Select
          label="Line Height"
          options={lineHeightOptions}
          value={settings.lineHeight}
          onChange={(value) =>
            handleSettingChange(
              "lineHeight",
              value as SettingsState["lineHeight"],
            )
          }
          variant="terminal"
        />
        <Select
          label="Timestamp Format"
          options={timestampOptions}
          value={settings.timestampFormat}
          onChange={(value) =>
            handleSettingChange(
              "timestampFormat",
              value as SettingsState["timestampFormat"],
            )
          }
          variant="terminal"
        />
      </div>

      <div className="space-y-3 pt-4 border-t border-terminal-border">
        <Checkbox
          variant="bracket"
          checked={settings.showMilliseconds}
          onChange={(e) =>
            handleSettingChange("showMilliseconds", e.target.checked)
          }
          label={
            <span className="font-mono text-sm text-text-primary">
              Show milliseconds in timestamps
            </span>
          }
        />
        <Checkbox
          variant="bracket"
          checked={settings.colorizeLogs}
          onChange={(e) =>
            handleSettingChange("colorizeLogs", e.target.checked)
          }
          label={
            <span className="font-mono text-sm text-text-primary">
              Colorize log levels (INFO=green, ERROR=red, etc.)
            </span>
          }
        />
      </div>
    </div>
  );

  const renderConnectionSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input
          label="API Endpoint"
          value={settings.apiEndpoint}
          onChange={(e) => handleSettingChange("apiEndpoint", e.target.value)}
          variant="terminal"
        />
        <Input
          label="WebSocket Endpoint"
          value={settings.wsEndpoint}
          onChange={(e) => handleSettingChange("wsEndpoint", e.target.value)}
          variant="terminal"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-terminal-border">
        <div>
          <label className="text-xs font-mono font-medium text-terminal-muted uppercase tracking-wider mb-2 block">
            Reconnect Interval (ms)
          </label>
          <input
            type="number"
            value={settings.reconnectInterval}
            onChange={(e) =>
              handleSettingChange("reconnectInterval", parseInt(e.target.value))
            }
            className="w-full h-9 px-3 border border-terminal-fg/30 bg-terminal-input text-terminal-fg font-mono text-sm focus:border-terminal-fg focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono font-medium text-terminal-muted uppercase tracking-wider mb-2 block">
            Max Reconnect Attempts
          </label>
          <input
            type="number"
            value={settings.maxReconnectAttempts}
            onChange={(e) =>
              handleSettingChange(
                "maxReconnectAttempts",
                parseInt(e.target.value),
              )
            }
            className="w-full h-9 px-3 border border-terminal-fg/30 bg-terminal-input text-terminal-fg font-mono text-sm focus:border-terminal-fg focus:outline-none"
          />
        </div>
      </div>

      <div className="p-4 border border-terminal-border bg-terminal-input/30">
        <div className="flex items-center gap-2 text-terminal-muted text-xs font-mono">
          <span className="text-terminal-accent">ℹ</span>
          <span>
            Connection settings will take effect after restarting the
            application.
          </span>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-mono font-medium text-terminal-muted uppercase tracking-wider mb-2 block">
          Max Logs in Memory
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={settings.maxLogsInMemory}
            onChange={(e) =>
              handleSettingChange("maxLogsInMemory", parseInt(e.target.value))
            }
            className="flex-1 accent-terminal-accent"
          />
          <span className="font-mono text-sm text-terminal-fg w-20 text-right">
            {settings.maxLogsInMemory.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-terminal-border">
        <Checkbox
          variant="bracket"
          checked={settings.autoCleanup}
          onChange={(e) => handleSettingChange("autoCleanup", e.target.checked)}
          label={
            <span className="font-mono text-sm text-text-primary">
              Automatically clean up old logs
            </span>
          }
        />
        {settings.autoCleanup && (
          <div className="ml-6 mt-2">
            <label className="text-xs font-mono text-terminal-muted mb-1 block">
              Cleanup Interval (seconds)
            </label>
            <input
              type="number"
              value={settings.cleanupInterval}
              onChange={(e) =>
                handleSettingChange("cleanupInterval", parseInt(e.target.value))
              }
              className="w-32 h-8 px-3 border border-terminal-fg/30 bg-terminal-input text-terminal-fg font-mono text-sm focus:border-terminal-fg focus:outline-none"
            />
          </div>
        )}
        <Checkbox
          variant="bracket"
          checked={settings.persistFilters}
          onChange={(e) =>
            handleSettingChange("persistFilters", e.target.checked)
          }
          label={
            <span className="font-mono text-sm text-text-primary">
              Remember filters between sessions
            </span>
          }
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Checkbox
          variant="bracket"
          checked={settings.enableNotifications}
          onChange={(e) =>
            handleSettingChange("enableNotifications", e.target.checked)
          }
          label={
            <span className="font-mono text-sm text-text-primary">
              Enable desktop notifications
            </span>
          }
        />
        {settings.enableNotifications && (
          <>
            <div className="ml-6 mt-2 space-y-2">
              <Checkbox
                variant="bracket"
                checked={settings.notifyOnError}
                onChange={(e) =>
                  handleSettingChange("notifyOnError", e.target.checked)
                }
                label={
                  <span className="font-mono text-sm text-text-primary">
                    Notify on ERROR level logs
                  </span>
                }
              />
              <Checkbox
                variant="bracket"
                checked={settings.notifyOnFatal}
                onChange={(e) =>
                  handleSettingChange("notifyOnFatal", e.target.checked)
                }
                label={
                  <span className="font-mono text-sm text-text-primary">
                    Notify on FATAL level logs
                  </span>
                }
              />
            </div>
          </>
        )}
      </div>

      <div className="p-4 border border-terminal-border bg-terminal-input/30">
        <div className="flex items-center gap-2 text-terminal-muted text-xs font-mono">
          <span className="text-log-warn">⚠</span>
          <span>
            Browser notification permission must be granted for this feature to
            work.
          </span>
        </div>
      </div>
    </div>
  );

  const renderShortcutSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(settings.shortcuts).map(([action, shortcut]) => (
          <div
            key={action}
            className="flex items-center justify-between p-3 border border-terminal-border bg-terminal-input/30"
          >
            <span className="font-mono text-sm text-text-primary capitalize">
              {action}
            </span>
            <kbd className="px-2 py-1 bg-terminal-border text-terminal-fg font-mono text-xs border border-terminal-fg/30">
              {shortcut}
            </kbd>
          </div>
        ))}
      </div>

      <div className="p-4 border border-terminal-border bg-terminal-input/30 mt-4">
        <div className="text-terminal-muted text-xs font-mono space-y-1">
          <p>Additional shortcuts:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex justify-between">
              <span>Scroll to bottom</span>
              <kbd className="text-terminal-fg">End</kbd>
            </div>
            <div className="flex justify-between">
              <span>Scroll to top</span>
              <kbd className="text-terminal-fg">Home</kbd>
            </div>
            <div className="flex justify-between">
              <span>Next log</span>
              <kbd className="text-terminal-fg">↓</kbd>
            </div>
            <div className="flex justify-between">
              <span>Previous log</span>
              <kbd className="text-terminal-fg">↑</kbd>
            </div>
            <div className="flex justify-between">
              <span>Copy selected</span>
              <kbd className="text-terminal-fg">Ctrl+C</kbd>
            </div>
            <div className="flex justify-between">
              <span>Select all</span>
              <kbd className="text-terminal-fg">Ctrl+A</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAboutSettings = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-terminal-fg mb-4">
          <span className="text-2xl font-mono text-terminal-fg">S</span>
        </div>
        <h2 className="text-xl font-mono text-terminal-fg mb-2">SENTINEL</h2>
        <p className="text-terminal-muted font-mono text-sm">
          Terminal-style log monitoring and analysis platform
        </p>
      </div>

      <div className="border border-terminal-border divide-y divide-terminal-border">
        <div className="flex justify-between p-3">
          <span className="font-mono text-sm text-terminal-muted">Version</span>
          <span className="font-mono text-sm text-terminal-fg">v1.0.0</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="font-mono text-sm text-terminal-muted">Build</span>
          <span className="font-mono text-sm text-terminal-fg">2026.01.29</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="font-mono text-sm text-terminal-muted">License</span>
          <span className="font-mono text-sm text-terminal-fg">MIT</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="font-mono text-sm text-terminal-muted">Author</span>
          <span className="font-mono text-sm text-terminal-fg">
            Sentinel Team
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="sm">
          View Documentation
        </Button>
        <Button variant="outline" size="sm">
          Report Issue
        </Button>
        <Button variant="outline" size="sm">
          Check Updates
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "display":
        return renderDisplaySettings();
      case "connection":
        return renderConnectionSettings();
      case "data":
        return renderDataSettings();
      case "notifications":
        return renderNotificationSettings();
      case "shortcuts":
        return renderShortcutSettings();
      case "about":
        return renderAboutSettings();
      default:
        return renderDisplaySettings();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header
        title="Sentinel"
        subtitle="Configure application settings"
        status={{
          connected: true,
          logsPerSecond: 0,
          totalLogs: 0,
        }}
      />

      <div className="border-b border-terminal-border bg-terminal-secondary px-6">
        <Navigation items={navigationItems} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-terminal-border bg-terminal-secondary flex flex-col">
          <div className="p-4 border-b border-terminal-border bg-terminal-input/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse" />
              <span className="font-mono text-sm text-terminal-accent uppercase tracking-wider">
                CONFIG
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full px-4 py-3 text-left font-mono text-sm transition-all duration-150 flex items-center gap-3",
                  activeSection === section.id
                    ? "bg-terminal-input text-terminal-fg border-l-2 border-l-terminal-accent"
                    : "text-text-secondary hover:bg-terminal-input/50 hover:text-text-primary border-l-2 border-l-transparent",
                )}
              >
                <span
                  className={cn(
                    "w-5 text-center",
                    activeSection === section.id
                      ? "text-terminal-accent"
                      : "text-terminal-muted",
                  )}
                >
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-terminal-border bg-terminal-input/30">
            <div className="flex items-center justify-between text-[10px] font-mono text-terminal-muted">
              <span>STATUS:</span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  hasChanges ? "text-log-warn" : "text-terminal-accent",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    hasChanges ? "bg-log-warn" : "bg-terminal-accent",
                    hasChanges && "animate-pulse",
                  )}
                />
                {hasChanges ? "MODIFIED" : "SAVED"}
              </span>
            </div>
          </div>
        </aside>

        <div className="flex-1 p-6 overflow-y-auto">
          <Card variant="terminal" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-fg/20 bg-terminal-input">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-log-error" />
                  <div className="w-2.5 h-2.5 bg-log-warn" />
                  <div className="w-2.5 h-2.5 bg-terminal-accent" />
                </div>
                <span className="text-terminal-fg font-mono text-xs tracking-wide">
                  sentinel@config:~$ ./configure --{activeSection}
                </span>
              </div>
              {hasChanges && (
                <Badge variant="secondary" size="sm">
                  unsaved changes
                </Badge>
              )}
            </div>

            <div className="p-6">
              <h2 className="text-lg font-mono text-terminal-fg mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="text-terminal-accent">[</span>
                {sections.find((s) => s.id === activeSection)?.label}
                <span className="text-terminal-accent">]</span>
              </h2>
              {renderContent()}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-terminal-fg/20 bg-terminal-input">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-mono text-xs uppercase tracking-wider",
                    saveStatus === "saved"
                      ? "text-terminal-accent"
                      : "text-terminal-muted",
                  )}
                >
                  {saveStatus === "saving"
                    ? "◉ SAVING..."
                    : saveStatus === "saved"
                      ? "● SAVED"
                      : "● CONFIG MODE"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={saveStatus === "saving"}
                >
                  RESET
                </Button>
                <Button
                  variant="terminal"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || saveStatus === "saving"}
                  glow={hasChanges}
                >
                  {saveStatus === "saving" ? "SAVING..." : "SAVE CHANGES"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
