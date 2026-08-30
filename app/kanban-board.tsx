"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  STATUS_LAMARAN,
  STATUS_FINAL,
  formatTanggal,
  daysSince,
} from "@/lib/constants";
import { updateStatusLamaran } from "@/app/actions/lamaran";

export type KanbanCard = {
  id: string;
  perusahaan: string;
  posisi: string;
  status: string;
  updateTerakhir: string;
  stale: boolean;
};

function Card({ card, dragging }: { card: KanbanCard; dragging?: boolean }) {
  return (
    <div
      className={`rounded-lg border bg-white px-2.5 py-2 text-sm ${
        card.stale ? "border-maroon" : "border-line hover:border-navy-dim"
      } ${dragging ? "rotate-1 opacity-40" : ""}`}
    >
      <div className="font-semibold leading-snug text-navy">{card.perusahaan}</div>
      <div className="text-[12px] leading-snug text-navy-dim">{card.posisi}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-navy-dim">
        <span>{formatTanggal(card.updateTerakhir)}</span>
        {card.stale && (
          <span className="rounded-md bg-maroon/10 px-1 font-medium text-maroon">
            {daysSince(card.updateTerakhir)} hari
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  const router = useRouter();
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/lamaran/${card.id}`)}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <Card card={card} dragging={isDragging} />
    </div>
  );
}

function ColumnShell({
  status,
  count,
  setNodeRef,
  isOver,
  children,
}: {
  status: string;
  count: number;
  setNodeRef?: (el: HTMLElement | null) => void;
  isOver?: boolean;
  children: React.ReactNode;
}) {
  const isFinal = STATUS_FINAL.includes(status as (typeof STATUS_FINAL)[number]);
  return (
    <div
      className={`flex w-60 shrink-0 flex-col overflow-hidden rounded-lg border border-t-2 border-line ${
        isFinal ? "border-t-line bg-sink/50" : "border-t-maroon bg-sink"
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5">
        <span
          className={`text-[12px] font-semibold ${
            isFinal ? "text-navy-dim" : "text-navy"
          }`}
        >
          {status}
        </span>
        <span className="rounded-full border border-line bg-white px-1.5 text-[11px] font-medium text-navy-dim">
          {count}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 p-2 ${
          isOver ? "bg-maroon/5" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Column({ status, cards }: { status: string; cards: KanbanCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <ColumnShell status={status} count={cards.length} setNodeRef={setNodeRef} isOver={isOver}>
      {cards.map((c) => (
        <DraggableCard key={c.id} card={c} />
      ))}
    </ColumnShell>
  );
}

export function KanbanBoard({ initial }: { initial: KanbanCard[] }) {
  const [cards, setCards] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => setMounted(true), []);

  const active = cards.find((c) => c.id === activeId) ?? null;

  // SSR / first client render: static board (no dnd-kit) so hydration matches.
  if (!mounted) {
    return (
      <div className="thin-scroll flex gap-3 overflow-x-auto pb-2">
        {STATUS_LAMARAN.map((status) => {
          const colCards = cards.filter((c) => c.status === status);
          return (
            <ColumnShell key={status} status={status} count={colCards.length}>
              {colCards.map((c) => (
                <Card key={c.id} card={c} />
              ))}
            </ColumnShell>
          );
        })}
      </div>
    );
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const newStatus = e.over ? String(e.over.id) : null;
    if (!newStatus) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === newStatus) return;

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
    startTransition(async () => {
      await updateStatusLamaran(id, newStatus);
      router.refresh();
    });
  }

  return (
    <DndContext
      id="zeus88-kanban"
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="thin-scroll flex gap-3 overflow-x-auto pb-2">
        {STATUS_LAMARAN.map((status) => (
          <Column
            key={status}
            status={status}
            cards={cards.filter((c) => c.status === status)}
          />
        ))}
      </div>
      <DragOverlay>{active ? <Card card={active} /> : null}</DragOverlay>
    </DndContext>
  );
}
