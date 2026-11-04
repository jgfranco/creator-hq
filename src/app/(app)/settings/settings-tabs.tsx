import { FilterTab } from "../filter-tab";

export function SettingsTabs({ active }: { active: "general" | "members" }) {
  return (
    <div className="mb-6 flex gap-1 text-sm">
      <FilterTab href="/settings" active={active === "general"}>
        General
      </FilterTab>
      <FilterTab href="/settings/members" active={active === "members"}>
        Members
      </FilterTab>
    </div>
  );
}
