import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportCard() {
  return (
    <Card size="sm" className="overflow-hidden shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="truncate text-sm">Mine is growing</CardTitle>
        <CardDescription className="line-clamp-3">
          Fitur-fitur tracker dan produktivitas akan ditambahkan secara bertahap ke dalam satu hub personal.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
