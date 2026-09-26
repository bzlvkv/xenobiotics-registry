/**
 * @xeno/core/schemas — Zod runtime validators
 *
 * Every op payload validates through one of these before applying.
 * Surface forms also use these as the single source of truth for "what's a
 * valid intake" / "what's a valid stack."
 *
 * Pairing with types.ts: every entity type has a corresponding entity schema,
 * and every OpKind has a corresponding payload schema in opPayloadSchemas.
 */

import { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────────

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'ulid');
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/, 'slug');
const iso = z.string().datetime({ offset: true }).or(z.string().datetime());
const score10 = z.number().int().min(0).max(10);
const doseUnit = z.enum(['mg', 'g', 'mcg', 'IU']);
const route = z.enum(['PO', 'SL', 'IM', 'IV', 'SC', 'IN', 'TD', 'INH', 'PR']);
const weekday = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

// ─── Item stock facet ─────────────────────────────────────────────────────────
// Defined up here (ahead of stackSchema) so both stackSchema and itemSchema can
// reference it — a stack may carry stock (a stocked protocol), and an item's
// stock facet is the same shape.

export const itemStockSchema = z.object({
  units_on_hand: z.number().min(0),
  cost_total: z.number().min(0).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BTC', 'ETH', 'XMR']).optional(),
  reorder_at: z.number().min(0).optional(),
  opened_at: iso.optional(),
  expires_at: iso.optional(),
  source_url: z.string().url().max(500).optional(),
  lot_id: z.string().max(80).optional(),
  storage_form: z
    .enum(['lyophilized', 'reconstituted', 'capsule', 'tablet', 'powder', 'liquid', 'oil', 'other'])
    .optional(),
});

// ─── Stack ──────────────────────────────────────────────────────────────────

export const stackItemSchema = z.object({
  id: ulid,
  compound: slug,
  dose: z.number().positive(),
  dose_unit: doseUnit,
  route,
  role: z.enum(['lead', 'support', 'cofactor']).optional(),
  offset_min: z.number().int().optional(),
  note: z.string().max(500).optional(),
  per_time_doses: z.array(z.number().positive()).max(12).optional(),
  /** Per-day dose overrides for weekly schedules, keyed by weekday. */
  per_day_doses: z.record(weekday, z.number().positive()).optional(),
});

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Schedule schema with legacy-shape preprocessors so old ops in the log
 * replay through `commit`/`applyRemote` without breaking, while writers
 * always emit the new canonical shape:
 *   • a `time` payload with a single `hhmm` (the v0.1 shape) → `{ times: [hhmm] }`.
 *   • a `weekly` payload with a single `day` (pre-multi-day shape) →
 *     `{ days: [day] }`.
 */
export const stackScheduleSchema = z.preprocess(
  (value) => {
    if (
      value &&
      typeof value === 'object' &&
      (value as { kind?: unknown }).kind === 'time' &&
      typeof (value as { hhmm?: unknown }).hhmm === 'string' &&
      !Array.isArray((value as { times?: unknown }).times)
    ) {
      const v = value as { hhmm: string };
      return { kind: 'time', times: [v.hhmm] };
    }
    if (
      value &&
      typeof value === 'object' &&
      (value as { kind?: unknown }).kind === 'weekly' &&
      typeof (value as { day?: unknown }).day === 'string' &&
      !Array.isArray((value as { days?: unknown }).days)
    ) {
      const v = value as { day: string; hhmm: string };
      return { kind: 'weekly', days: [v.day], hhmm: v.hhmm };
    }
    return value;
  },
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('manual') }),
    z.object({
      kind: z.literal('time'),
      times: z.array(hhmm).min(1).max(12),
    }),
    z.object({
      kind: z.literal('weekly'),
      days: z.array(weekday).min(1).max(7),
      hhmm,
      /** Per-day time overrides ("different time per day" mode); `hhmm`
       *  is the fallback for any day not listed. */
      day_times: z.record(weekday, hhmm).optional(),
    }),
    z.object({
      kind: z.literal('every_n_days'),
      n: z.number().int().min(1).max(365),
      hhmm,
      anchor_date: ymd,
    }),
    z.object({
      kind: z.literal('every_n_hours'),
      n: z.number().int().min(1).max(168),
      anchor_at: iso,
    }),
    z.object({ kind: z.literal('cron'), expr: z.string() }),
  ]),
);

export const stackStatusSchema = z.enum([
  'planning',
  'active',
  'conditional',
  'paused',
  'archived',
]);

export const stackSchema = z.object({
  id: ulid,
  name: z.string().min(1).max(120),
  intent: z.string().max(500).optional(),
  schedule: stackScheduleSchema,
  items: z.array(stackItemSchema).max(64),
  last_fired_at: iso.optional(),
  status: stackStatusSchema.default('active'),
  /** Optional inventory facet for a stocked protocol (a multivitamin you
   *  both schedule and hold N of). Folds into the item's stock facet. */
  stock: itemStockSchema.optional(),
  created_at: iso,
  updated_at: iso,
});

// ─── Fire mode ──────────────────────────────────────────────────────────────

/** Mode tag on a stack.fire op. Optional — pre-existing ops in the log
 *  predate this field and replay as `{ kind: 'instant' }`. Rate mode
 *  carries the resolved duration + steps inline so replay output is
 *  invariant under future UI preset retunes. */
export const fireModeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('instant') }),
  z.object({
    kind: z.literal('rate'),
    duration_min: z.number().int().min(1).max(720),
    steps: z.number().int().min(2).max(48),
  }),
  z.object({ kind: z.literal('trigger'), steps_total: z.number().int().min(2).max(24) }),
]);

// ─── Trigger ────────────────────────────────────────────────────────────────

export const triggerTemplateItemSchema = z.object({
  compound: slug,
  dose: z.number().positive(),
  dose_unit: doseUnit,
  route,
  offset_min: z.number().int().optional(),
  note: z.string().max(500).optional(),
});

export const triggerSchema = z.object({
  id: ulid,
  stack_id: ulid,
  /** Optional display name — set for stack-less triggers (food logs)
   *  whose stack_id resolves to no Stack. See Trigger.label. */
  label: z.string().max(120).optional(),
  template_intakes: z.array(triggerTemplateItemSchema).min(1).max(64),
  steps_total: z.number().int().min(2).max(24),
  steps_taken: z.number().int().min(0),
  status: z.enum(['active', 'completed', 'cancelled']),
  scheduled_at: iso,
  created_at: iso,
  updated_at: iso,
});

// ─── Intake ─────────────────────────────────────────────────────────────────

export const intakeSchema = z.object({
  id: ulid,
  stack_id: ulid.optional(),
  compound: slug,
  dose: z.number().positive(),
  dose_unit: doseUnit,
  route,
  at: iso,
  /** Display name for a freeform / not-in-registry intake, carried from the
   *  StackItem on fire. Must be listed or Zod strips it at commit, leaving
   *  the log + edit modal to fall back to the raw slug. See Intake.label. */
  label: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  /** Catalog preset slug this food intake came from — drives the /run
   *  catalog's "✦ N" usage badges. Must be listed here or Zod strips it
   *  from the op payload at commit (it ignores unknown keys). */
  source_food: slug.optional(),
  created_at: iso,
  updated_at: iso,
});

// ─── Observation ────────────────────────────────────────────────────────────

export const sideEffectSchema = z.object({
  label: z.string().min(1).max(80),
  severity: z.number().int().min(1).max(3),
});

export const observationSchema = z.object({
  id: ulid,
  at: iso,
  mood: score10.optional(),
  energy: score10.optional(),
  focus: score10.optional(),
  sleep_quality: score10.optional(),
  anxiety: score10.optional(),
  libido: score10.optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  side_effects: z.array(sideEffectSchema).max(20).optional(),
  note: z.string().max(2000).optional(),
  created_at: iso,
  updated_at: iso,
});

// ─── Compound notes ───────────────────────────────────────────────────────────

export const compoundNoteSchema = z.object({
  id: ulid,
  compound: slug,
  body: z.string().min(1).max(4000),
  created_at: iso,
  updated_at: iso,
});

// ─── User foods — foods a user added when their product wasn't in the catalog ─
// FoodPreset-shaped, op-logged + E2E-synced, merged into the /run catalog. The
// category enum mirrors core's FoodCategory (kept in sync with the registry
// loader's foodCategorySchema).

const foodCategoryEnum = z.enum([
  'fast_food',
  'energy_drink',
  'soda',
  'sports_drink',
  'coffee_tea',
  'juice',
  'snack',
  'supplement',
  'alcohol',
  'electrolyte',
  'produce',
  'protein',
  'grain',
  'meat_seafood',
  'dairy',
  'condiment',
  'other',
]);

const userFoodItemSchema = z.object({
  compound: slug,
  label: z.string().min(1).max(80).optional(),
  dose: z.number().positive(),
  dose_unit: doseUnit,
  route: route.optional(),
});

export const userFoodSchema = z.object({
  id: ulid,
  slug,
  name: z.string().min(1).max(120),
  category: foodCategoryEnum,
  path: z.array(z.string().min(1).max(60)).max(5).optional(),
  serving: z.string().min(1).max(80),
  items: z.array(userFoodItemSchema).min(1).max(64),
  created_at: iso,
  updated_at: iso,
});

// ─── Maud lenses — saved, named starting points for the assistant ─────────────

const maudLensConversationBody = z
  .object({
    messages: z.array(z.unknown()),
    timestamps: z.array(z.string()),
  })
  // Backstop the op-payload / sync budget — a saved thread with large tool_result
  // blocks could otherwise bloat the op stream. The app also trims before saving.
  .refine((b) => JSON.stringify(b).length <= 256_000, {
    message: 'conversation too large to save',
  });

const maudLensContextBody = z.object({
  dataAccess: z.boolean(),
  windowDays: z.number().int().min(1).max(365).optional(),
  compounds: z.array(slug).max(200).optional(),
});

// No `tone` field: it was declared and seeded but never read by anything, so a
// lens advertised a knob the app could not honor. Zod strips unknown keys, so a
// lens op authored before the removal still validates — `tone` is just dropped.
const maudLensPerspectiveBody = z.object({
  mode: z.enum(['ask', 'review', 'author']),
  systemPromptExtra: z.string().max(4000).optional(),
});

const maudLensCommon = {
  id: ulid,
  name: z.string().min(1).max(120),
  created_at: iso,
  updated_at: iso,
};

export const maudLensSchema = z.discriminatedUnion('kind', [
  z.object({ ...maudLensCommon, kind: z.literal('conversation'), body: maudLensConversationBody }),
  z.object({ ...maudLensCommon, kind: z.literal('context'), body: maudLensContextBody }),
  z.object({ ...maudLensCommon, kind: z.literal('perspective'), body: maudLensPerspectiveBody }),
]);

// ─── Inventory ──────────────────────────────────────────────────────────────

export const inventoryLotSchema = z.object({
  id: ulid,
  compound: slug,
  brand: z.string().max(120).optional(),
  lot_id: z.string().max(80).optional(),
  mg_per_unit: z.number().positive(),
  units_on_hand: z.number().min(0),
  cost_total: z.number().min(0).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BTC', 'ETH', 'XMR']).optional(),
  opened_at: iso.optional(),
  expires_at: iso.optional(),
  source_url: z.string().url().max(500).optional(),
  reorder_at: z.number().min(0).optional(),
  storage_form: z
    .enum(['lyophilized', 'reconstituted', 'capsule', 'tablet', 'powder', 'liquid', 'oil', 'other'])
    .optional(),
  created_at: iso,
  updated_at: iso,
});

// ─── Item (unified inventory + stack entity) ──────────────────────────────────
// (itemStockSchema is defined up top so stackSchema can reference it.)

export const itemProtocolSchema = z.object({
  schedule: stackScheduleSchema,
  status: stackStatusSchema.default('active'),
  intent: z.string().max(500).optional(),
  last_fired_at: iso.optional(),
});

export const itemSchema = z.object({
  id: ulid,
  /** Optional: bare single-compound lots have no name (display falls back
   *  to the component's registry name); products + protocols set one. */
  name: z.string().min(1).max(120).optional(),
  brand: z.string().max(120).optional(),
  components: z.array(stackItemSchema).min(1).max(64),
  // nullable so an item.update can explicitly CLEAR stock (null survives
  // JSON; an absent/undefined stock inherits the prior value at replay).
  stock: itemStockSchema.nullable().optional(),
  protocol: itemProtocolSchema.optional(),
  created_at: iso,
  updated_at: iso,
});

// ─── Lab ────────────────────────────────────────────────────────────────────

export const labMarkerSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.number(),
  unit: z.string().min(1).max(40),
  ref_low: z.number().optional(),
  ref_high: z.number().optional(),
});

export const labResultSchema = z.object({
  id: ulid,
  drawn_at: iso,
  panel: z.string().max(200).optional(),
  source: z.string().max(120).optional(),
  ordered_by: z.string().max(120).optional(),
  markers: z.array(labMarkerSchema).max(200),
  attachment_id: ulid.optional(),
  note: z.string().max(2000).optional(),
  created_at: iso,
  updated_at: iso,
});

// ─── Attachment ─────────────────────────────────────────────────────────────

export const attachmentSchema = z.object({
  id: ulid,
  storage_path: z.string().min(1).max(500),
  size_bytes: z.number().int().min(0),
  mime: z.string().min(1).max(80),
  caption: z.string().max(500).optional(),
  created_at: iso,
});

// ─── Op payloads ────────────────────────────────────────────────────────────
//
// Each op kind ↔ schema. The applier picks via this map; the commit path
// validates inputs against the same map before sealing.

export const opPayloadSchemas = {
  // intake
  'intake.create': intakeSchema,
  'intake.update': intakeSchema.partial({ created_at: true }).extend({ id: ulid }),
  'intake.delete': z.object({ id: ulid }),
  // Atomic multi-intake insert — the tally tracker spreads an inhaled
  // burst into one micro-intake per breath without an op per tap.
  'intake.createMany': z.object({ intakes: z.array(intakeSchema).min(1) }),

  // stack
  'stack.create': stackSchema,
  'stack.update': stackSchema.partial({ created_at: true }).extend({ id: ulid }),
  'stack.delete': z.object({ id: ulid }),
  'stack.fire': z.object({
    stack_id: ulid,
    fired_at: iso,
    /** override-able list of intakes to record; defaults to stack items */
    intakes: z.array(intakeSchema),
    /** Optional commit strategy — when present, identifies how the
     *  intakes were derived (instant=now, rate=expanded across time).
     *  Trigger mode never lands here since it dispatches to
     *  `trigger.create` instead. Pre-existing ops in the log have no
     *  `mode` field; they replay as `{ kind: 'instant' }`. */
    mode: fireModeSchema.optional(),
  }),

  // ─── Trigger (deferred fire that the user advances on Today) ────────────
  'trigger.create': triggerSchema,
  /** Records that the user tapped "take next step" on a trigger card.
   *  Payload carries:
   *    - the trigger id being advanced
   *    - the intakes to record (one per template item, with `at` = now
   *      shifted by any per-item offset_min)
   *    - bumped steps_taken value
   *    - new updated_at
   *  The applier inserts the intakes AND updates the trigger in one
   *  atomic step so a Today re-render after the tap sees both. When
   *  steps_taken reaches steps_total, the trigger's status is flipped
   *  to 'completed' so the Today card disappears on its own. */
  'trigger.step': z.object({
    trigger_id: ulid,
    intakes: z.array(intakeSchema).min(1),
    steps_taken: z.number().int().min(1),
    updated_at: iso,
  }),
  'trigger.cancel': z.object({
    trigger_id: ulid,
    updated_at: iso,
  }),

  // observation (was signal in v0.1)
  'observation.create': observationSchema,
  'observation.update': observationSchema.partial({ created_at: true }).extend({ id: ulid }),
  'observation.delete': z.object({ id: ulid }),

  // compound notes — freeform user notes on a registry compound
  'compound_note.create': compoundNoteSchema,
  'compound_note.update': compoundNoteSchema.partial({ created_at: true }).extend({ id: ulid }),
  'compound_note.delete': z.object({ id: ulid }),

  // maud lenses — saved assistant starting points (conversation / context / perspective).
  // Update is a partial: rename sends { id, name, updated_at } (omit body to keep it);
  // a body edit sends body opaque (same trust model the conversation snapshot uses).
  'maud_lens.create': maudLensSchema,
  'maud_lens.update': z.object({
    id: ulid,
    name: z.string().min(1).max(120).optional(),
    body: z.unknown().optional(),
    updated_at: iso,
  }),
  'maud_lens.delete': z.object({ id: ulid }),

  // user foods — foods the user added when not in the catalog (FoodPreset-shaped).
  // Update omits `slug` (immutable post-create; the applier keeps the existing
  // one via spread) + `created_at`, so both are optional here.
  'user_food.create': userFoodSchema,
  'user_food.update': userFoodSchema.partial({ created_at: true, slug: true }).extend({ id: ulid }),
  'user_food.delete': z.object({ id: ulid }),

  // inventory
  'inventory.create': inventoryLotSchema,
  'inventory.update': inventoryLotSchema.partial({ created_at: true }).extend({ id: ulid }),
  'inventory.delete': z.object({ id: ulid }),
  /** decrement on intake — units to subtract from on-hand */
  'inventory.consume': z.object({
    lot_id: ulid,
    units: z.number().positive(),
    /** intake that drove this decrement, for audit */
    intake_id: ulid.optional(),
    at: iso,
  }),
  /** restock — increment on receipt, optional cost append */
  'inventory.restock': z.object({
    lot_id: ulid,
    units: z.number().positive(),
    cost_total: z.number().min(0).optional(),
    at: iso,
  }),

  // item — unified successor to inventory.* + stack.* (legacy ops above
  // still replay; they fold into the same `items` projection)
  'item.create': itemSchema,
  'item.update': itemSchema.partial({ created_at: true }).extend({ id: ulid }),
  'item.delete': z.object({ id: ulid }),
  /** decrement stock — units to subtract from on-hand */
  'item.consume': z.object({
    item_id: ulid,
    units: z.number().positive(),
    /** intake/fire that drove this decrement, for audit */
    intake_id: ulid.optional(),
    at: iso,
  }),
  /** restock — increment on receipt, optional cost append */
  'item.restock': z.object({
    item_id: ulid,
    units: z.number().positive(),
    cost_total: z.number().min(0).optional(),
    at: iso,
  }),
  /** fire — log the composition as intakes (like stack.fire); a stocked
   *  item additionally self-decrements via a follow-on item.consume. */
  'item.fire': z.object({
    item_id: ulid,
    fired_at: iso,
    intakes: z.array(intakeSchema),
    mode: fireModeSchema.optional(),
  }),

  // lab
  'lab.create': labResultSchema,
  'lab.update': labResultSchema.partial({ created_at: true }).extend({ id: ulid }),
  'lab.delete': z.object({ id: ulid }),

  // attachment — attach links a blob to an entity; detach unlinks
  'attachment.attach': attachmentSchema.extend({
    /** what entity the attachment hangs off — surfaces filter by this */
    target: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('intake'), id: ulid }),
      z.object({ kind: z.literal('observation'), id: ulid }),
      z.object({ kind: z.literal('lab'), id: ulid }),
      z.object({ kind: z.literal('inventory'), id: ulid }),
    ]),
  }),
  'attachment.detach': z.object({ id: ulid }),

  // profile + tweaks
  'profile.update': z.object({
    display_name: z.string().max(120).optional(),
    timezone: z.string().optional(),
    weight_kg: z.number().min(20).max(400).optional(),
  }),
  'tweaks.set': z.object({
    edits: z.record(z.unknown()),
  }),

  // schedule — skip/dismiss a specific scheduled slot so a deliberate no-show
  // stops surfacing as a missed dose. Idempotent (first-write wins); the
  // reducer keys it by (stack_id, at_ms). at_ms is the slot's scheduled
  // instant, which uniquely identifies that day's slot (the next day's is a
  // different instant), so a skip never leaks across days.
  'schedule.skip': z.object({
    stack_id: z.string().min(1).max(64),
    /** Scheduled slot instant, epoch ms. */
    at_ms: z.number().int().nonnegative(),
    /** ISO timestamp the user skipped it. */
    at: iso,
  }),

  // achievement — unlock records the first time the user crossed an
  // achievement def's threshold. Idempotent: subsequent ops for the
  // same id are ignored by the reducer (first-write wins).
  'achievement.unlock': z.object({
    /** Achievement def id (e.g. 'streak.7', 'breadth.30'). */
    id: z.string().min(1).max(120),
    /** ISO timestamp the threshold was crossed. */
    at: iso,
  }),
} as const;

export type OpPayload<K extends keyof typeof opPayloadSchemas> = z.infer<
  (typeof opPayloadSchemas)[K]
>;
