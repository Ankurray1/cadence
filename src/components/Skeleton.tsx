export function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#ece9f1] ${className}`} />;
}

export function PageSkeleton({ variant = "list" }: { variant?: "list" | "calendar" | "editor" | "settings" }) {
  if (variant === "editor")
    return (
      <div>
        <div className="flex h-[53px] items-center gap-3 border-b border-line bg-surface px-6"><Bar className="h-6 w-6" /><Bar className="h-5 w-56" /><Bar className="ml-auto h-8 w-28" /><Bar className="h-8 w-24" /></div>
        <div className="mx-auto grid max-w-[1400px] gap-6 px-6 py-6 lg:grid-cols-2">
          <Bar className="h-[560px] rounded-3xl" />
          <Bar className="h-[560px] rounded-3xl" />
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <Bar className="h-3 w-40" />
      <Bar className="mt-3 h-9 w-72" />
      <Bar className="mt-2 h-4 w-96 max-w-full" />
      {variant === "calendar" ? (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-3"><Bar className="h-40 rounded-3xl" /><Bar className="h-40 rounded-3xl" /><Bar className="h-40 rounded-3xl" /></div>
          <Bar className="mt-6 h-[520px] rounded-3xl" />
        </>
      ) : variant === "settings" ? (
        <div className="mt-8 max-w-3xl space-y-4"><Bar className="h-40 rounded-3xl" /><Bar className="h-56 rounded-3xl" /><Bar className="h-40 rounded-3xl" /></div>
      ) : (
        <>
          <Bar className="mt-8 h-56 rounded-3xl" />
          <div className="mt-6 grid grid-cols-3 gap-3"><Bar className="h-28 rounded-3xl" /><Bar className="h-28 rounded-3xl" /><Bar className="h-28 rounded-3xl" /></div>
          <Bar className="mt-6 h-64 rounded-3xl" />
        </>
      )}
    </div>
  );
}
