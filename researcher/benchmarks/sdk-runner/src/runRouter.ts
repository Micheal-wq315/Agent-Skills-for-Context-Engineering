/**
 * Stage 2: Skill router benchmark.
 *
 * Hypothesis: the activation-scenario descriptions in v2.2.0 frontmatter let a
 * frontier model route prompts to the correct skill at high top-1 accuracy.
 *
 * Procedure (per the methodology in researcher/benchmarks/PLAN.md):
 *   1. Load 50+ ground-truth prompts from router/prompts.jsonl.
 *   2. For each (prompt, model, replication), build a routing prompt with the
 *      15 skill descriptions in deterministically-shuffled order.
 *   3. Call Agent.prompt() with settingSources: [] (no skills loaded; the
 *      descriptions in the prompt are the only signal).
 *   4. Parse strict JSON ranking. Score top-1 and top-3 accuracy.
 *   5. Persist per-run JSON + transcript; append a summary to history.
 *
 * Runs only execute when CURSOR_API_KEY is set AND a cost cap is provided.
 * --dry-run prints the plan and cost forecast and exits cleanly.
 */

import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

import {
  RESEARCHER_DIR,
  REPO_ROOT,
  apiKeyFingerprint,
  appendHistoryEntry,
  assertBudget,
  buildRunPlan,
  fixtureSha,
  forecastCost,
  loadJsonl,
  loadSkillDescriptions,
  parseCliFlags,
  repoCommitSha,
  resolveConfig,
  runHeader,
  shuffleSeeded,
  todayUtc,
  utcNow,
  writeJson,
} from "./common.ts";

interface RouterPrompt {
  prompt_id: string;
  prompt: string;
  expected_primary_skill: string;
  acceptable_secondary_skills?: string[];
  rejected_skills?: string[];
  reason?: string;
}

interface RouterRunRecord {
  prompt_id: string;
  model_id: string;
  rep: number;
  shuffle_seed: number;
  status: "format_failure" | "model_unavailable" | "finished" | "error" | "cancelled" | "dry_run";
  duration_ms?: number;
  predicted_primary?: string;
  predicted_top3?: string[];
  top1_correct?: boolean;
  top3_correct?: boolean;
  raw_text?: string;
  notes?: string;
}

const DEFAULT_FIXTURE = join(RESEARCHER_DIR, "benchmarks", "router", "prompts.jsonl");
const ROUTING_PROMPT_TEMPLATE = join(RESEARCHER_DIR, "benchmarks", "router", "routing-prompt.md");
const RESULTS_DIR = join(RESEARCHER_DIR, "benchmarks", "router", "results");
const HISTORY_PATH = join(RESEARCHER_DIR, "reports", "router-history.jsonl");

const ESTIMATED_TOKENS_INPUT = 4000;
const ESTIMATED_TOKENS_OUTPUT = 400;
const ESTIMATED_USD_PER_RUN = 0.012;

async function main(): Promise<number> {
  const flags = parseCliFlags(process.argv.slice(2));
  const config = resolveConfig(flags, DEFAULT_FIXTURE);

  console.log(runHeader("Router Benchmark (Stage 2)"));
  console.log(`fixture: ${config.fixturePath}`);
  console.log(`models: ${config.models.join(", ")}`);
  console.log(`reps per (prompt, model): ${config.reps}`);
  console.log(`seed: ${config.seed}`);
  console.log(`dry-run: ${config.dryRun}`);
  console.log(`api key: ${apiKeyFingerprint()}`);

  const prompts = loadJsonl<RouterPrompt>(config.fixturePath);
  console.log(`prompts loaded: ${prompts.length}`);
  if (!prompts.length) {
    console.error("No prompts in fixture; aborting.");
    return 1;
  }

  const skills = loadSkillDescriptions();
  console.log(`skills available: ${skills.length}`);

  const plan = buildRunPlan(
    prompts.map((p) => p.prompt_id),
    config.models,
    config.reps,
    config.seed,
  );
  const forecast = forecastCost(plan, ESTIMATED_TOKENS_INPUT, ESTIMATED_TOKENS_OUTPUT, ESTIMATED_USD_PER_RUN);
  console.log(`planned runs: ${forecast.totalRuns}`);
  console.log(`est. tokens per run: ${ESTIMATED_TOKENS_INPUT}in / ${ESTIMATED_TOKENS_OUTPUT}out`);
  console.log(`est. total cost: ${forecast.estimatedTotalUsd} USD`);

  assertBudget(plan, forecast, config);

  if (config.dryRun) {
    console.log("Dry-run: no SDK calls made.");
    if (plan[0]) {
      const sample = prompts.find((p) => p.prompt_id === plan[0].promptId)!;
      const shuffled = shuffleSeeded(skills.map((s) => s.name), plan[0].shuffleSeed);
      console.log("sample plan item:", plan[0]);
      console.log("sample skill order:", shuffled);
      console.log("sample prompt:", sample.prompt);
    }
    return 0;
  }

  if (!process.env.CURSOR_API_KEY) {
    console.error("CURSOR_API_KEY is not set. Refusing to run.");
    return 1;
  }

  let cursorSdk: typeof import("@cursor/sdk") | null = null;
  try {
    cursorSdk = await import("@cursor/sdk");
  } catch {
    console.error(
      "@cursor/sdk is not installed. Run `npm install` inside researcher/benchmarks/sdk-runner before executing.",
    );
    return 1;
  }
  const { Agent, CursorAgentError } = cursorSdk;

  const promptTemplate = await loadPromptTemplate();
  const results: RouterRunRecord[] = [];
  const runDir = join(RESULTS_DIR, `${todayUtc()}-${config.seed}`);
  mkdirSync(runDir, { recursive: true });

  for (const item of plan) {
    const prompt = prompts.find((p) => p.prompt_id === item.promptId);
    if (!prompt) continue;
    const shuffledSkills = shuffleSeeded(skills, item.shuffleSeed);
    const filled = renderPrompt(promptTemplate, shuffledSkills, prompt.prompt);

    const record: RouterRunRecord = {
      prompt_id: item.promptId,
      model_id: item.modelId,
      rep: item.rep,
      shuffle_seed: item.shuffleSeed,
      status: "error",
    };
    const started = Date.now();
    try {
      const result = await Agent.prompt(filled, {
        apiKey: process.env.CURSOR_API_KEY!,
        model: { id: item.modelId },
        local: { cwd: REPO_ROOT, settingSources: [] },
      });
      record.duration_ms = Date.now() - started;
      record.status = result.status;
      record.raw_text = result.result ?? "";
      const parsed = parseRouterJson(result.result ?? "");
      if (!parsed) {
        record.status = "format_failure";
      } else {
        record.predicted_primary = parsed[0];
        record.predicted_top3 = parsed.slice(0, 3);
        record.top1_correct = parsed[0] === prompt.expected_primary_skill;
        record.top3_correct = parsed.slice(0, 3).includes(prompt.expected_primary_skill);
      }
    } catch (error) {
      record.duration_ms = Date.now() - started;
      if (CursorAgentError && error instanceof CursorAgentError) {
        record.status = "model_unavailable";
        record.notes = error.message;
      } else {
        record.notes = (error as Error).message;
      }
    }
    results.push(record);
    writeJson(join(runDir, `${item.promptId}-${item.modelId}-${item.rep}.json`), record);
  }

  const summary = summarize(results, prompts);
  writeJson(join(runDir, "summary.json"), summary);
  appendHistoryEntry(HISTORY_PATH, {
    timestamp: utcNow(),
    repo_sha: repoCommitSha(),
    fixture_sha: fixtureSha(config.fixturePath),
    seed: config.seed,
    models: config.models,
    reps: config.reps,
    prompts: prompts.length,
    summary,
  });

  console.log("summary:", summary);
  console.log(`raw results in ${runDir}`);
  return 0;
}

async function loadPromptTemplate(): Promise<string> {
  const { readFileSync, existsSync } = await import("node:fs");
  if (!existsSync(ROUTING_PROMPT_TEMPLATE)) {
    throw new Error(`Routing prompt template missing: ${ROUTING_PROMPT_TEMPLATE}`);
  }
  return readFileSync(ROUTING_PROMPT_TEMPLATE, "utf-8");
}

function renderPrompt(
  template: string,
  shuffledSkills: Array<{ name: string; description: string }>,
  userPrompt: string,
): string {
  const skillBlock = shuffledSkills
    .map((skill, index) => `${index + 1}. ${skill.name}\n   ${skill.description}`)
    .join("\n\n");
  return template
    .replace("{{SKILL_BLOCK}}", skillBlock)
    .replace("{{USER_PROMPT}}", userPrompt)
    .replace("{{SKILL_COUNT}}", String(shuffledSkills.length));
}

function parseRouterJson(raw: string): string[] | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.ranking)) {
      return parsed.ranking.map((value: unknown) => String(value));
    }
    return null;
  } catch {
    return null;
  }
}

function summarize(results: RouterRunRecord[], prompts: RouterPrompt[]): Record<string, unknown> {
  const perModel: Record<string, { total: number; format_failures: number; top1: number; top3: number }> = {};
  for (const r of results) {
    const bucket = perModel[r.model_id] ?? { total: 0, format_failures: 0, top1: 0, top3: 0 };
    bucket.total += 1;
    if (r.status === "format_failure") bucket.format_failures += 1;
    if (r.top1_correct) bucket.top1 += 1;
    if (r.top3_correct) bucket.top3 += 1;
    perModel[r.model_id] = bucket;
  }
  const summary: Record<string, unknown> = {};
  for (const [model, b] of Object.entries(perModel)) {
    summary[model] = {
      total: b.total,
      format_failure_rate: Number((b.format_failures / b.total).toFixed(4)),
      top1_accuracy: Number((b.top1 / b.total).toFixed(4)),
      top3_accuracy: Number((b.top3 / b.total).toFixed(4)),
    };
  }
  summary["promptCount"] = prompts.length;
  return summary;
}

void writeFileSync;

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error);
    process.exit(2);
  });
