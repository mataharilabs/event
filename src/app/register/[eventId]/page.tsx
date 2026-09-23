import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, eventTickets, registrationFields } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { RegistrationForm } from "./registration-form";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.lifecycleStatus, "published")),
  });
  return {
    title: event ? `Daftar — ${event.title}` : "Daftar Event",
    robots: { index: false },
  };
}

export default async function RegisterPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    const { eventId } = await params;
    redirect(`/login?callbackUrl=/register/${eventId}`);
  }

  const { eventId } = await params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.lifecycleStatus, "published")),
  });

  if (!event) notFound();

  const tickets = await db
    .select()
    .from(eventTickets)
    .where(and(eq(eventTickets.eventId, eventId), eq(eventTickets.isActive, true)));

  const customFields = await db
    .select()
    .from(registrationFields)
    .where(eq(registrationFields.eventId, eventId))
    .orderBy(registrationFields.sortOrder);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">Formulir Pendaftaran</p>
        </div>
        <RegistrationForm
          event={event}
          tickets={tickets}
          customFields={customFields}
          userId={session.user.id!}
          userEmail={session.user.email ?? ""}
          userName={session.user.name ?? ""}
        />
      </div>
    </main>
  );
}
