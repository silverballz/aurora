"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Tag } from "lucide-react";
import { AuroraShell, PageHeader, StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";

export default function ParticipantEventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.events) setEvents(data.events);
    }
    load();
  }, []);

  return (
    <AuroraShell>
      <PageHeader
        eyebrow="Kaltarang 2026"
        title="Festival Events"
        description="Competitions, cultural evenings, and workshops open to registered external participants."
      />

      <div className="mx-auto grid max-w-5xl gap-6 p-5 sm:p-8 lg:grid-cols-2 lg:p-12">
        {events.map((evt) => (
          <article key={evt.id} className="surface overflow-hidden flex flex-col justify-between">
            <div className="event-art">
              <span>{evt.name.split(" ")[0]}</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <StatusPill tone="success">Active Registration</StatusPill>
                <h2 className="mt-3 font-display text-2xl font-bold">{evt.name}</h2>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {evt.description}
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-primary" />
                    <span>{evt.date} · {evt.start_time} - {evt.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{evt.venue}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Campus Access Granted</span>
                <span className="text-success font-semibold">✓ Verified</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AuroraShell>
  );
}
