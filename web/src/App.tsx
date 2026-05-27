import { useState, useCallback, useEffect } from "react";
import type { Group, Currency } from "./lib/types";
import { loadGroups, saveGroups } from "./lib/storage";
import QuickSplit from "./components/QuickSplit";
import GroupList from "./components/GroupList";
import GroupView from "./components/GroupView";

type Page = "quick" | "groups";

export default function App() {
  const [page, setPage] = useState<Page>("quick");
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");

  // Persist groups to localStorage
  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const handleCreateGroup = useCallback((group: Group) => {
    setGroups((prev) => [...prev, group]);
  }, []);

  const handleDeleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setSelectedGroupId((prev) => (prev === id ? null : prev));
  }, []);

  const handleUpdateGroup = useCallback((updated: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }, []);

  const selectedGroup = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId) ?? null
    : null;

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "quick", label: "Quick Split", icon: "⚡" },
    { id: "groups", label: "Groups", icon: "👥" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3 lg:px-6"
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--glass)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-lg font-bold cursor-pointer"
            style={{ color: "var(--ink)" }}
            onClick={() => {
              setSelectedGroupId(null);
              setPage("quick");
            }}
          >
            💰 Split
          </h1>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setSelectedGroupId(null);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
              style={{
                background:
                  page === item.id && !selectedGroupId
                    ? "var(--accent)"
                    : "transparent",
                color:
                  page === item.id && !selectedGroupId
                    ? "#fff"
                    : "var(--ink)",
                border: "none",
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 lg:px-6">
        {selectedGroup ? (
          <GroupView
            group={selectedGroup}
            onUpdateGroup={handleUpdateGroup}
            onBack={() => setSelectedGroupId(null)}
          />
        ) : page === "quick" ? (
          <QuickSplit currency={currency} onCurrencyChange={setCurrency} />
        ) : (
          <GroupList
            groups={groups}
            currency={currency}
            onCurrencyChange={setCurrency}
            onSelectGroup={setSelectedGroupId}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="sm:hidden shrink-0 flex items-center justify-around py-2"
        style={{
          borderTop: "1px solid var(--line)",
          background: "var(--dock)",
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setPage(item.id);
              setSelectedGroupId(null);
            }}
            className="flex flex-col items-center gap-0.5 px-4 py-1 cursor-pointer"
            style={{
              background: "transparent",
              border: "none",
              color:
                page === item.id && !selectedGroupId
                  ? "var(--accent)"
                  : "var(--muted)",
            }}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer
        className="hidden sm:flex shrink-0 items-center justify-center px-4 py-2 text-xs"
        style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}
      >
        Bill Splitter — Free on FreeAppStore
      </footer>
    </div>
  );
}
