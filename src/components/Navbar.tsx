"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E8E3DC] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#4CAF50]">
          NourishAI
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium pb-0.5 transition-colors ${
                  active
                    ? "text-[#4CAF50] border-b-2 border-[#4CAF50]"
                    : "text-[#7A756E] hover:text-[#2D2A26]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/plan"
            className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
              pathname === "/plan"
                ? "bg-[#4CAF50] text-white"
                : "bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20"
            }`}
          >
            Get Plan
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-[#FAF8F5]"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span
              className={`block h-0.5 bg-[#2D2A26] rounded transition-transform duration-200 ${
                menuOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 bg-[#2D2A26] rounded transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 bg-[#2D2A26] rounded transition-transform duration-200 ${
                menuOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E8E3DC] bg-white px-4 pb-3">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2.5 text-sm font-medium ${
                  active ? "text-[#4CAF50]" : "text-[#7A756E]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/plan"
            onClick={() => setMenuOpen(false)}
            className={`inline-block mt-1 text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
              pathname === "/plan"
                ? "bg-[#4CAF50] text-white"
                : "bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20"
            }`}
          >
            Get Plan
          </Link>
        </div>
      )}
    </nav>
  );
}
