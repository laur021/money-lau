import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading financial workspace"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-28 rounded-lg" key={index} />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <Skeleton className="h-[28rem] rounded-lg" />
        <Skeleton className="h-[28rem] rounded-lg" />
      </section>
      <Skeleton className="h-72 rounded-lg" />
    </main>
  );
}
