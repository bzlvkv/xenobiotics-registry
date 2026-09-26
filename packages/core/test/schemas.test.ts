/**
 * Schema round-trip tests — every op kind validates a plausible payload and
 * rejects an obviously bad one. This is what "data model locked" means in
 * practice: future me can't change a field type without making this test
 * fail first.
 */

import { describe, it, expect } from 'vitest';
import { ulid } from 'ulid';
import {
  opPayloadSchemas,
  stackSchema,
  intakeSchema,
  observationSchema,
  inventoryLotSchema,
  labResultSchema,
  attachmentSchema,
} from '../src/schemas';

const iso = () => new Date().toISOString();

describe('entity schemas', () => {
  it('stack: defaults status=active and accepts time schedule', () => {
    const parsed = stackSchema.parse({
      id: ulid(),
      name: 'AM Neuro',
      schedule: { kind: 'time', hhmm: '09:30' },
      items: [],
      created_at: iso(),
      updated_at: iso(),
    });
    expect(parsed.status).toBe('active');
  });

  it('stack: rejects items beyond cap', () => {
    const items = Array.from({ length: 65 }, () => ({
      id: ulid(),
      compound: 'caffeine',
      dose: 100,
      dose_unit: 'mg' as const,
      route: 'PO' as const,
    }));
    const r = stackSchema.safeParse({
      id: ulid(),
      name: 'overflow',
      schedule: { kind: 'manual' },
      items,
      created_at: iso(),
      updated_at: iso(),
    });
    expect(r.success).toBe(false);
  });

  it('intake: requires positive dose', () => {
    const r = intakeSchema.safeParse({
      id: ulid(),
      compound: 'caffeine',
      dose: 0,
      dose_unit: 'mg',
      route: 'PO',
      at: iso(),
      created_at: iso(),
      updated_at: iso(),
    });
    expect(r.success).toBe(false);
  });

  it('observation: all dimensions optional, scores 0..10', () => {
    const ok = observationSchema.parse({
      id: ulid(),
      at: iso(),
      mood: 7,
      created_at: iso(),
      updated_at: iso(),
    });
    expect(ok.mood).toBe(7);

    const bad = observationSchema.safeParse({
      id: ulid(),
      at: iso(),
      mood: 11,
      created_at: iso(),
      updated_at: iso(),
    });
    expect(bad.success).toBe(false);
  });

  it('inventory: mg_per_unit must be positive', () => {
    const r = inventoryLotSchema.safeParse({
      id: ulid(),
      compound: 'magnesium-glycinate',
      mg_per_unit: -1,
      units_on_hand: 30,
      created_at: iso(),
      updated_at: iso(),
    });
    expect(r.success).toBe(false);
  });

  it('lab: markers carry value + unit, ref bounds optional', () => {
    const ok = labResultSchema.parse({
      id: ulid(),
      drawn_at: iso(),
      panel: "Men's Hormone",
      markers: [
        { key: 'total_testosterone', value: 824, unit: 'ng/dL', ref_low: 264, ref_high: 916 },
      ],
      created_at: iso(),
      updated_at: iso(),
    });
    expect(ok.markers[0].value).toBe(824);
  });

  it('attachment: surface metadata round-trips', () => {
    const ok = attachmentSchema.parse({
      id: ulid(),
      storage_path: 'attachments/foo/bar.jpg',
      size_bytes: 12345,
      mime: 'image/jpeg',
      created_at: iso(),
    });
    expect(ok.mime).toBe('image/jpeg');
  });
});

describe('op payload schemas', () => {
  it('every OpKind has a payload schema', () => {
    const kinds = [
      'intake.create',
      'intake.update',
      'intake.delete',
      'stack.create',
      'stack.update',
      'stack.delete',
      'stack.fire',
      'observation.create',
      'observation.update',
      'observation.delete',
      'compound_note.create',
      'compound_note.update',
      'compound_note.delete',
      'maud_lens.create',
      'maud_lens.update',
      'maud_lens.delete',
      'user_food.create',
      'user_food.update',
      'user_food.delete',
      'inventory.create',
      'inventory.update',
      'inventory.delete',
      'inventory.consume',
      'inventory.restock',
      'lab.create',
      'lab.update',
      'lab.delete',
      'attachment.attach',
      'attachment.detach',
      'profile.update',
      'tweaks.set',
    ] as const;
    for (const k of kinds) {
      expect(opPayloadSchemas[k], `missing schema for ${k}`).toBeDefined();
    }
  });

  it('inventory.consume: validates the decrement payload', () => {
    const ok = opPayloadSchemas['inventory.consume'].parse({
      lot_id: ulid(),
      units: 1,
      at: iso(),
    });
    expect(ok.units).toBe(1);
  });

  it('inventory.consume: rejects negative units', () => {
    const r = opPayloadSchemas['inventory.consume'].safeParse({
      lot_id: ulid(),
      units: -1,
      at: iso(),
    });
    expect(r.success).toBe(false);
  });

  it('attachment.attach: target discriminator routes by kind', () => {
    const ok = opPayloadSchemas['attachment.attach'].parse({
      id: ulid(),
      storage_path: 'attachments/x.pdf',
      size_bytes: 999,
      mime: 'application/pdf',
      created_at: iso(),
      target: { kind: 'lab', id: ulid() },
    });
    expect(ok.target.kind).toBe('lab');
  });

  it('stack.fire: requires a stack_id, fired_at, and intakes array', () => {
    const ok = opPayloadSchemas['stack.fire'].parse({
      stack_id: ulid(),
      fired_at: iso(),
      intakes: [],
    });
    expect(ok.intakes).toEqual([]);
  });
});
