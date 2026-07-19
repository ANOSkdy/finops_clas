export type IconName = "home" | "calendar" | "checklist" | "document" | "rating" | "send" | "manual" | "settings" | "user" | "admin" | "theme" | "search" | "chevron" | "check" | "arrow" | "menu" | "more";

const paths: Record<IconName, string[]> = {
  home: ["M3 11.5 12 4l9 7.5", "M5.5 10v10h13V10", "M9.5 20v-6h5v6"],
  calendar: ["M5 3v3M19 3v3M4 8h16", "M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z"],
  checklist: ["m5 7 1.5 1.5L9 6", "M11 7h8", "m5 12 1.5 1.5L9 11", "M11 12h8", "m5 17 1.5 1.5L9 16", "M11 17h8"],
  document: ["M6 3h8l4 4v14H6Z", "M14 3v5h4", "M9 13h6M9 17h6"],
  rating: ["M12 3 15 9l6 .9-4.5 4.4 1.1 6.2L12 17.6l-5.6 2.9 1.1-6.2L3 9.9 9 9Z"],
  send: ["m4 4 17 8-17 8 3-8Z", "M7 12h14"],
  manual: ["M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23Z", "M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23Z"],
  settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1M12 2v3M12 19v3M2 12h3M19 12h3"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 22a8 8 0 0 1 16 0"],
  admin: ["M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6Z", "m9 12 2 2 4-4"],
  theme: ["M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"],
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z", "m16 16 5 5"],
  chevron: ["m8 10 4 4 4-4"],
  check: ["m5 12 4 4L19 6"],
  arrow: ["M5 12h14", "m14 7 5 5-5 5"],
  menu: ["M4 7h16M4 12h16M4 17h16"],
  more: ["M6 12h.01M12 12h.01M18 12h.01"]
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name].map((path) => <path d={path} key={path} />)}</svg>;
}
