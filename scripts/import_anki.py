#!/usr/bin/env python3
"""
import_anki.py — One-time MSL Study Room seeder
═══════════════════════════════════════════════════════════════════════════════
Reads APKG files from your Anki batch folder, extracts Q&A pairs, inserts
them into Supabase study_cards and creates initial card_progress rows
(due_date = today) so they appear in tomorrow's review queue immediately.

Lanes imported (MSL only):
  lane1  RecSys & Ranking       (387 notes)
  lane2  DL & PyTorch           (150 notes — v0.2 only, v0.1 skipped)
  lane3  MLOps                  (120 notes)
  lane4  Spark / PySpark        (146 notes)
  lane5  Cloud & Storage        (75 notes)
  lane6  sklearn & pandas       (110 notes)

Skipped:
  lane7  LLMs  → belongs in GAL
  lane8  Experimentation → belongs in PAL
  lane2_v0.1 → duplicate of v0.2

SETUP
══════
1. Run the schema first:
   Supabase dashboard → SQL Editor → paste contents of supabase/study_schema.sql

2. Get your user ID:
   Supabase dashboard → Authentication → Users → copy your user UUID

3. Get a service key (bypasses RLS for inserts):
   Supabase dashboard → Settings → API → service_role key

4. Install dependencies:
   pip install supabase

5. Set environment variables (or create a .env file — do NOT commit it):
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_KEY="eyJ..."
   export MSL_USER_ID="your-user-uuid-here"
   export ANKI_DIR="/path/to/your/batch 1 folder"

6. Run:
   python scripts/import_anki.py

   Add --dry-run to preview without inserting.
   Add --lane lane4 to import only one lane.
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import zipfile
import sqlite3
import tempfile
import argparse
import datetime
from pathlib import Path


# ── Lane config ───────────────────────────────────────────────────────────────
# Maps filename substring → (lane_id, lane_label)
# Files not in this map are skipped.
LANE_MAP = {
    'lane1_DS_ML_Master_recsys':        ('lane1', 'RecSys & Ranking'),
    'lane2_DS_ML_Master_dl_pytorch_v0_2': ('lane2', 'DL & PyTorch'),   # v0.2 only
    'lane3_DS_ML_Master_mlops':         ('lane3', 'MLOps'),
    'lane4_DS_ML_Master_spark':         ('lane4', 'Spark / PySpark'),
    'lane5_DS_ML_Master_cloud':         ('lane5', 'Cloud & Storage'),
    'lane6_DS_ML_Master_sklearn':       ('lane6', 'sklearn & pandas'),
}

# These files exist but are intentionally skipped — log them so the user knows.
SKIPPED_REASONS = {
    'lane2_DS_ML_Master_dl_pytorch_v0_1': 'superseded by v0.2',
    'lane7_DS_ML_Master_llms':            'belongs in GAL (GenAI Systems Lab)',
    'lane8_DS_ML_Master_experimentation': 'belongs in PAL (Product Analytics Lab)',
    'Mark 1':                             'personal deck — not a lane deck',
    'Viltrumite':                         'personal deck — not a lane deck',
}


def extract_notes(apkg_path: Path) -> list[tuple[str, str]]:
    """
    Extract (front, back) pairs from an APKG file.
    APKG is a ZIP containing collection.anki2 (SQLite).
    Fields are separated by \\x1f (Anki field separator).
    HTML tags are stripped from front and back.
    """
    import re

    def strip_html(text: str) -> str:
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Decode common HTML entities
        text = text.replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
        # Collapse excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    notes = []
    with zipfile.ZipFile(apkg_path) as z:
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            tmp.write(z.read('collection.anki2'))
            tmp_path = tmp.name

    try:
        conn = sqlite3.connect(tmp_path)
        c = conn.cursor()
        rows = c.execute('SELECT flds FROM notes').fetchall()
        conn.close()

        for (flds,) in rows:
            parts = flds.split('\x1f')
            if len(parts) < 2:
                continue
            front = strip_html(parts[0])
            back  = strip_html(parts[1])
            if front and back:
                notes.append((front, back))
    finally:
        os.unlink(tmp_path)

    return notes


def match_lane(filename: str) -> tuple[str, str] | None:
    """Return (lane_id, lane_label) for a given filename, or None if skipped."""
    for key, value in LANE_MAP.items():
        if key in filename:
            return value
    return None


def get_skip_reason(filename: str) -> str | None:
    for key, reason in SKIPPED_REASONS.items():
        if key in filename:
            return reason
    return None


def run_import(
    supabase_url: str,
    service_key: str,
    user_id: str,
    anki_dir: Path,
    dry_run: bool = False,
    lane_filter: str | None = None,
) -> None:
    from supabase import create_client

    client = create_client(supabase_url, service_key)
    today  = datetime.date.today().isoformat()

    apkg_files = sorted(anki_dir.glob('*.apkg'))
    if not apkg_files:
        print(f'✗ No .apkg files found in {anki_dir}')
        sys.exit(1)

    total_inserted = 0

    for apkg_path in apkg_files:
        fname = apkg_path.name

        lane_info = match_lane(fname)
        if lane_info is None:
            reason = get_skip_reason(fname)
            if reason:
                print(f'  skip  {fname}  [{reason}]')
            else:
                print(f'  skip  {fname}  [not in lane map]')
            continue

        lane_id, lane_label = lane_info

        if lane_filter and lane_id != lane_filter:
            print(f'  skip  {fname}  [--lane filter]')
            continue

        print(f'\n→ {fname}')
        print(f'  lane: {lane_id} ({lane_label})')

        notes = extract_notes(apkg_path)
        print(f'  extracted {len(notes)} notes')

        if dry_run:
            for i, (front, back) in enumerate(notes[:3]):
                print(f'  [{i+1}] Q: {front[:80]}')
                print(f'       A: {back[:60]}')
            if len(notes) > 3:
                print(f'  ... and {len(notes) - 3} more')
            continue

        # Insert study_cards in batches of 50
        BATCH = 50
        card_ids = []

        for i in range(0, len(notes), BATCH):
            batch = notes[i:i + BATCH]
            rows = [
                {
                    'user_id':   user_id,
                    'lane':      lane_id,
                    'topic':     None,
                    'front':     front,
                    'back':      back,
                    'card_type': 'concept',
                }
                for front, back in batch
            ]
            result = client.table('study_cards').insert(rows).execute()
            inserted_ids = [r['id'] for r in result.data]
            card_ids.extend(inserted_ids)
            print(f'  cards inserted: {i + len(batch)}/{len(notes)}', end='\r')

        print(f'  ✓ {len(card_ids)} cards inserted        ')

        # Insert initial card_progress rows (due_date = today → show up immediately)
        progress_rows = [
            {
                'user_id':      user_id,
                'card_id':      cid,
                'interval_days': 0,
                'due_date':     today,
            }
            for cid in card_ids
        ]

        for i in range(0, len(progress_rows), BATCH):
            batch = progress_rows[i:i + BATCH]
            client.table('card_progress').insert(batch).execute()
            print(f'  progress rows:  {i + len(batch)}/{len(progress_rows)}', end='\r')

        print(f'  ✓ {len(progress_rows)} progress rows created')
        total_inserted += len(card_ids)

    print(f'\n{"─" * 50}')
    if dry_run:
        print('Dry run complete — nothing was inserted.')
    else:
        print(f'Done. {total_inserted} cards imported across all lanes.')
        print(f'Open MSL, sign in, press Shift+Ctrl+K to review.')


def main():
    parser = argparse.ArgumentParser(description='Import Anki APKG files into MSL Study Room')
    parser.add_argument('--dry-run', action='store_true', help='Preview without inserting')
    parser.add_argument('--lane', default=None, help='Import only this lane (e.g. lane4)')
    args = parser.parse_args()

    # ── Config from env ──
    supabase_url = os.environ.get('SUPABASE_URL', '').strip()
    service_key  = os.environ.get('SUPABASE_SERVICE_KEY', '').strip()
    user_id      = os.environ.get('MSL_USER_ID', '').strip()
    anki_dir_str = os.environ.get('ANKI_DIR', '').strip()

    missing = []
    if not supabase_url:  missing.append('SUPABASE_URL')
    if not service_key:   missing.append('SUPABASE_SERVICE_KEY')
    if not user_id:       missing.append('MSL_USER_ID')
    if not anki_dir_str:  missing.append('ANKI_DIR')

    if missing and not args.dry_run:
        print('✗ Missing required environment variables:')
        for m in missing:
            print(f'  export {m}="..."')
        print('\nSee the script header for full setup instructions.')
        sys.exit(1)

    if args.dry_run and not anki_dir_str:
        print('✗ Set ANKI_DIR even for dry-run so the script can find .apkg files.')
        sys.exit(1)

    anki_dir = Path(anki_dir_str)
    if not anki_dir.exists():
        print(f'✗ ANKI_DIR does not exist: {anki_dir}')
        sys.exit(1)

    print(f'MSL Study Room — Anki Import')
    print(f'{"─" * 50}')
    print(f'ANKI_DIR:  {anki_dir}')
    print(f'USER_ID:   {user_id or "(dry-run)"}')
    print(f'Dry run:   {args.dry_run}')
    if args.lane:
        print(f'Lane:      {args.lane} only')
    print()

    run_import(
        supabase_url=supabase_url,
        service_key=service_key,
        user_id=user_id,
        anki_dir=anki_dir,
        dry_run=args.dry_run,
        lane_filter=args.lane,
    )


if __name__ == '__main__':
    main()
