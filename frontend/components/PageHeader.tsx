type Crumb = {
  label: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
}) {
  return (
    <header className="vs-card-glow rounded-2xl border border-white/[0.08] bg-[#121826]/80 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[#9CA3AF]">
        {breadcrumbs.map((crumb) => crumb.label).join(" > ")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-[#F9FAFB]">{title}</h1>
      {description ? <p className="mt-1 text-sm text-[#9CA3AF]">{description}</p> : null}
    </header>
  );
}
