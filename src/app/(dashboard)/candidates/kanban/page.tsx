"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/sira/StatusBadge";
import { Loader2, UserCircle2, Calendar } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

type ApplicantStatus =
  | "REGISTERED"
  | "MEDICAL_APPROVED"
  | "LMIS_CLEAR"
  | "MUSANED_CONTRACTED"
  | "ENJAZ_COMPLETED"
  | "FLIGHT_READY";

interface KanbanCard {
  id: string;
  firstName: string;
  lastName: string;
  passportNumber: string;
  status: ApplicantStatus;
  dateOfExpiry: string;
  passportPhotoUrl: string | null;
  createdAt: string;
}

const COLUMN_ORDER: ApplicantStatus[] = [
  "REGISTERED",
  "MEDICAL_APPROVED",
  "LMIS_CLEAR",
  "MUSANED_CONTRACTED",
  "ENJAZ_COMPLETED",
  "FLIGHT_READY",
];

const COLUMN_COLORS: Record<ApplicantStatus, string> = {
  REGISTERED: "#5e6ad2",
  MEDICAL_APPROVED: "#0ea5e9",
  LMIS_CLEAR: "#a855f7",
  MUSANED_CONTRACTED: "#f59e0b",
  ENJAZ_COMPLETED: "#10b981",
  FLIGHT_READY: "#27a644",
};

function CandidateCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: "Card", card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const daysToExpiry = Math.round(
    (new Date(card.dateOfExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface-2 border border-hairline rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-hairline-strong transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-surface-3 border border-hairline flex items-center justify-center flex-shrink-0">
          {card.passportPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.passportPhotoUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserCircle2 className="w-5 h-5 text-ink-tertiary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink truncate">
            {card.firstName} {card.lastName}
          </p>
          <p className="text-[10px] text-ink-tertiary font-mono mt-0.5">{card.passportNumber}</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px]">
          <Calendar className="w-3 h-3 text-ink-tertiary" />
          <span
            className={
              daysToExpiry < 60
                ? "text-error font-semibold"
                : daysToExpiry < 180
                ? "text-warning"
                : "text-ink-tertiary"
            }
          >
            {daysToExpiry < 0
              ? "EXPIRED"
              : daysToExpiry < 60
              ? `${daysToExpiry}d ⚠`
              : `${daysToExpiry}d`}
          </span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  cards,
  t,
}: {
  status: ApplicantStatus;
  cards: KanbanCard[];
  t: any;
}) {
  const color = COLUMN_COLORS[status];

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "Column", status },
  });

  return (
    <div
      ref={setNodeRef}
      className="kanban-column flex-shrink-0 w-64 flex flex-col"
      style={{ minHeight: "calc(100vh - 200px)" }}
    >
      {/* Column Header */}
      <div
        className="px-4 py-3 border-b border-hairline flex items-center justify-between"
        style={{ borderTop: `2px solid ${color}` }}
      >
        <span className="text-xs font-semibold text-ink">{t.status[status] || status}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className={`flex-1 p-3 space-y-2 overflow-y-auto bg-surface-1/50 transition-colors ${isOver ? 'ring-inset ring-2 ring-primary/40' : ''}`}>
          {cards.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-ink-tertiary border border-dashed border-hairline rounded-lg">
              {t.candidates.noCandidates.replace(".", "")}
            </div>
          ) : (
            cards.map((card) => <CandidateCard key={card.id} card={card} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [columns, setColumns] = useState<Record<ApplicantStatus, KanbanCard[]>>({
    REGISTERED: [],
    MEDICAL_APPROVED: [],
    LMIS_CLEAR: [],
    MUSANED_CONTRACTED: [],
    ENJAZ_COMPLETED: [],
    FLIGHT_READY: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/applicants/kanban");
        if (res.ok) {
          const { grouped } = await res.json();
          setColumns((prev) => ({ ...prev, ...grouped }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const findColumnForCard = useCallback(
    (cardId: string): ApplicantStatus | null => {
      for (const [status, cards] of Object.entries(columns)) {
        if (cards.find((c) => c.id === cardId)) return status as ApplicantStatus;
      }
      return null;
    },
    [columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const col = findColumnForCard(active.id as string);
    if (col) {
      const card = columns[col].find((c) => c.id === active.id);
      setActiveCard(card || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const sourceCol = findColumnForCard(active.id as string);
    const targetCol = COLUMN_ORDER.includes(over.id as ApplicantStatus)
      ? (over.id as ApplicantStatus)
      : findColumnForCard(over.id as string);

    if (!sourceCol || !targetCol || sourceCol === targetCol) return;

    // Optimistic update
    setColumns((prev) => {
      const card = prev[sourceCol].find((c) => c.id === active.id)!;
      return {
        ...prev,
        [sourceCol]: prev[sourceCol].filter((c) => c.id !== active.id),
        [targetCol]: [{ ...card, status: targetCol }, ...prev[targetCol]],
      };
    });

    // Persist to DB
    try {
      await fetch(`/api/applicants/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetCol }),
      });
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline text-ink font-semibold">{t.nav.kanban}</h2>
          <p className="text-xs text-ink-subtle">{t.candidates.subtitle}</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "600px" }}>
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn key={status} status={status} cards={columns[status] || []} t={t} />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="bg-surface-2 border border-primary/50 rounded-lg p-3.5 shadow-2xl w-64 rotate-2 scale-105">
              <p className="text-xs font-semibold text-ink">
                {activeCard.firstName} {activeCard.lastName}
              </p>
              <p className="text-[10px] text-ink-tertiary font-mono mt-0.5">
                {activeCard.passportNumber}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
