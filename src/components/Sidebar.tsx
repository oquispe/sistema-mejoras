/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialTrendingTopics } from "../data";

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function Sidebar({ selectedCategory, onSelectCategory }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col p-6 gap-6 h-fit w-64 bg-white shadow-md rounded-2xl border border-[#eff4ff] sticky top-24 select-none">
      <div className="mb-2">
        <h2 className="text-xl font-bold font-headline-md text-primary">Trending</h2>
        <p className="text-xs font-semibold text-on-surface-variant font-label-md tracking-wide mt-1">Explore hot topics</p>
      </div>

      <nav className="flex flex-col gap-1.5 font-label-md">
        {/* All topics toggler */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-3 p-3 text-left rounded-xl transition-all duration-200 ${
            selectedCategory === null
              ? "bg-secondary-container text-on-secondary-container font-semibold shadow-sm border border-secondary/15"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
          id="sidebar-category-all"
        >
          <span className="material-symbols-outlined text-[20px]">
            dashboard
          </span>
          <span className="text-sm">All Innovations</span>
        </button>

        {initialTrendingTopics.map((topic) => {
          const isSelected = selectedCategory === topic.name;
          return (
            <button
              key={topic.name}
              onClick={() => onSelectCategory(isSelected ? null : topic.name)}
              className={`flex items-center gap-3 p-3 text-left rounded-xl transition-all duration-200 ${
                isSelected
                  ? "bg-secondary-container text-on-secondary-container font-semibold shadow-sm border border-secondary/15Translate py-2.5"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
              id={`sidebar-category-${topic.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {topic.icon}
              </span>
              <span className="text-sm">{topic.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Info card footer inside sidebar to look clean and custom */}
      <div className="mt-4 pt-4 border-t border-[#eff4ff] text-[11px] text-outline leading-relaxed">
        <p>Clicking topics filters the feed and portfolio cards recursively.</p>
      </div>
    </aside>
  );
}
