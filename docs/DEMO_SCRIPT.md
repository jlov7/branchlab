# Demo Script (5 minutes)

## Setup
1. `make setup`
2. `make dev`
3. Open the app.

## Part 1 — Replay (30–60s)
1. Click **Seed demo trace**.
2. Open run `run_demo_fail`.
3. Show:
   - Summary strip (status = FAIL)
   - Timeline with tool calls
   - Inspector drawer with raw JSON

Key line:
> “This is deterministic replay. Nothing is being re-run.”

## Part 2 — Fork (60–90s)
1. Click an event: `tool.response` for `pricing.lookup`.
2. Hit **F** or click **Fork from here**.
3. Choose intervention: **Override tool output**.
4. Paste the “correct” output snippet:
   ```json
   {
     "product": "ACME Widget",
     "price": 100.0,
     "currency": "USD",
     "as_of": "2026-02-27"
   }
   ```
5. Choose **Replay-only** branch and create.

Show:
- Branch creation progress
- Branch appears in Runs list

## Part 3 — Compare + Causality (90s)
1. Click **Compare**.
2. Select Original vs Branch.
3. Show:
   - Outcome delta: FAIL → SUCCESS
   - First divergence marker
   - Changed tool output diff
   - Trace physics evidence hash
   - Candidate confidence
4. Open **Causality**.
5. Save an investigation, select a candidate span, add a reviewer note, and resolve the hypothesis.

Key line:
> “This is why we need counterfactual branching: we can prove which step mattered.”

## Part 4 — Policy Lab (30–60s)
1. Open **Policy Lab**
2. Load `examples/policies/block_network.yaml`
3. Run on both runs
4. Show the impact preview: violations by tool and severity

Close with:
> “Now governance can run ‘what would this policy have prevented?’ on real traces.”

## Part 5 — Evidence Pack (30s)
1. Open **Evidence**.
2. Create a redacted evidence pack.
3. Show the exported contract: normalized trace, Trace IR, trace physics, causal diff, evals, policies, investigations, span annotations, and provenance.

Close with:
> “The artifact is the product: another engineer can inspect the same evidence without trusting the UI.”
