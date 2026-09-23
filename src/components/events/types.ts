import type { EventLifecycleStatus } from "@/types";

export interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    primaryImageUrl: string | null;
    startDatetime: Date;
    endDatetime: Date;
    timezone: string;
    lifecycleStatus: EventLifecycleStatus;
    attendanceMode: string;
    venueName: string | null;
    minPrice: number;
    maxPrice: number;
    totalQuota: number | null;
    soldCount: number;
  };
}
