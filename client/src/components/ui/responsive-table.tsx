import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  className?: string;
  emptyMessage?: string;
  mobileCardTitle?: (item: T) => string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = "No data available",
  mobileCardTitle
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className={cn("overflow-x-auto", className)}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "text-left py-3 px-4 font-medium text-sm text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn("py-3 px-4 text-sm", column.className)}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <Card key={keyExtractor(item)}>
            {mobileCardTitle && (
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {mobileCardTitle(item)}
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className={mobileCardTitle ? "pt-0" : ""}>
              <div className="space-y-2">
                {columns.map((column) => {
                  const value = item[column.key];
                  if (!value && value !== 0) return null;
                  
                  return (
                    <div key={String(column.key)} className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className="text-sm">
                        {column.render
                          ? column.render(value, item)
                          : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}