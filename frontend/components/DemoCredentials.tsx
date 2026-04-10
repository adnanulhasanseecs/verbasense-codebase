"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { DEMO_CREDENTIALS, type DemoCredential } from "@/lib/demo-credentials";

const accentClass: Record<DemoCredential["accent"], string> = {
  sky: "demo-card--sky",
  violet: "demo-card--violet",
  cyan: "demo-card--cyan",
  amber: "demo-card--amber",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);

  const onCopy = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      } catch {
        // noop for restricted clipboard contexts
      }
    },
    [text],
  );

  return (
    <button type="button" onClick={onCopy} className="demo-copy-btn">
      {done ? "Copied" : label}
    </button>
  );
}

export function DemoCredentials() {
  const router = useRouter();

  const enterAs = useCallback(
    (persona: DemoCredential) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "verbasense.activePersona",
          JSON.stringify({
            id: persona.id,
            role: persona.role,
            email: persona.email,
            enteredAt: new Date().toISOString(),
          }),
        );
      }
      router.push("/dashboard");
    },
    [router],
  );

  return (
    <section className="vs-section demo-credentials">
      <div className="demo-credentials__head">
        <div>
          <h2 className="demo-credentials__title">Choose your persona</h2>
          <p className="demo-credentials__subtitle">
            Click any card to enter that role and continue to role-specific dashboards.
          </p>
        </div>
        <span className="demo-pill">Click a card to enter</span>
      </div>

      <div className="demo-grid">
        {DEMO_CREDENTIALS.map((c) => (
          <article
            key={c.id}
            className={`demo-card ${accentClass[c.accent]}`}
            role="button"
            tabIndex={0}
            onClick={() => enterAs(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                enterAs(c);
              }
            }}
            aria-label={`Enter as ${c.role}`}
          >
            <div className="demo-card__glow" />
            <header className="demo-card__head">
              <p className="demo-card__kicker">{c.subtitle}</p>
              <h3 className="demo-card__title">{c.role}</h3>
            </header>

            <div className="demo-card__row">
              <p className="demo-card__value">{c.email}</p>
              <CopyButton text={c.email} label="Copy email" />
            </div>
            <div className="demo-card__row">
              <p className="demo-card__value demo-card__value--muted">**************</p>
              <CopyButton text={c.password} label="Copy password" />
            </div>

            <p className="demo-card__scope">{c.scope}</p>
            <p className="demo-card__enter">Enter as {c.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

