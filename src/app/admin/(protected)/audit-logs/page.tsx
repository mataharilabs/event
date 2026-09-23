import { db } from "@/db";
import { auditLogs, adminUsers } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log — Admin",
  robots: { index: false, follow: false },
};

const ACTION_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "outline" | "warning"> = {
  CREATE_EVENT: "success",
  PUBLISH_EVENT: "success",
  UPDATE_EVENT: "default",
  CANCEL_EVENT: "destructive",
  ARCHIVE_EVENT: "secondary",
  DUPLICATE_EVENT: "outline",
  VERIFY_PAYMENT: "success",
  REJECT_PAYMENT: "destructive",
  CHANGE_REGISTRATION_STATUS: "warning",
  EXPORT_PARTICIPANTS: "secondary",
  UPDATE_TICKET: "default",
  CREATE_TICKET: "success",
  RESEND_NOTIFICATION: "default",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 30;

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
        adminName: adminUsers.name,
        adminEmail: adminUsers.email,
      })
      .from(auditLogs)
      .innerJoin(adminUsers, eq(auditLogs.adminId, adminUsers.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset)
      .catch(() => []),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .catch(() => [{ count: 0 }]),
  ]);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{total} total entri</p>
      </div>

      <div className="bg-white rounded-xl border">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Belum ada audit log.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((log) => {
                const variant = ACTION_VARIANTS[log.action] ?? "default";
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div>{formatDate(log.createdAt)}</div>
                      <div>{formatTime(log.createdAt)}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{log.adminName}</div>
                      <div className="text-xs text-muted-foreground">{log.adminEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant} className="text-xs whitespace-nowrap">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{log.entity}</div>
                      <div className="font-mono">{log.entityId.slice(0, 12)}…</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/audit-logs?page=${page - 1}`}>Sebelumnya</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/audit-logs?page=${page + 1}`}>Selanjutnya</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
