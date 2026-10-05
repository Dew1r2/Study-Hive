import { useState } from "react";
import { ChevronDown, ExternalLink, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="space-y-7">
      <header className="max-w-2xl">
        <p className="eyebrow">Your space</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Manage your profile and find important information about Study Hive.
        </p>
      </header>

      <section className="hive-card flex flex-wrap items-center justify-between gap-5 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <UserRound size={21} />
          </span>
          <div>
            <h2 className="font-bold">Your profile</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
              Change your display name, avatar, study status, and profile
              effect.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="focus-ring rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-bold hover:bg-muted"
          data-testid="link-settings-profile"
        >
          Edit profile
        </Link>
      </section>

      <section className="hive-card p-5 sm:p-7">
        <button
          type="button"
          onClick={() => setAboutOpen((open) => !open)}
          aria-expanded={aboutOpen}
          aria-controls="about-study-hive"
          className="focus-ring flex w-full items-center justify-between gap-4 rounded-xl text-left"
          data-testid="button-about-study-hive"
        >
          <span className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <ShieldCheck size={21} />
            </span>
            <span>
              <strong className="block">About Study Hive</strong>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Curriculum sources, learning-aid notes, and safety information.
              </span>
            </span>
          </span>
          <ChevronDown
            size={19}
            className={`shrink-0 text-muted-foreground transition-transform ${
              aboutOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {aboutOpen && (
          <div
            id="about-study-hive"
            className="mt-6 grid gap-4 border-t border-border pt-5 text-sm leading-6 text-muted-foreground"
            data-testid="panel-about-study-hive"
          >
            <p>
              <strong className="text-foreground">Study Hive is an independent learning aid.</strong>{" "}
              It is not an official NCDC publication and is not endorsed by the
              National Curriculum Development Centre.
            </p>
            <p>
              Syllabus links open NCDC source documents. Study Hive summaries,
              guides, and activity steps are written as learning support and may
              contain mistakes or differ from updated curriculum materials.
              Check important information with your teacher and the current
              syllabus.
            </p>
            <p>
              Practical activities are prompts for learning, not approved lab
              procedures. Do not try an experiment without teacher approval,
              supervision, and the right safety equipment.
            </p>
            <a
              href="https://ncdc.go.ug/books"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex w-fit items-center gap-2 rounded-lg font-semibold text-primary underline underline-offset-4"
              data-testid="link-about-ncdc-books"
            >
              Open NCDC curriculum resources <ExternalLink size={14} />
            </a>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-5 sm:p-7">
        <p className="eyebrow">Study data</p>
        <h2 className="mt-2 font-bold">Saved on this device</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Focus sessions, saved guides, and drafts are separated by account in
          this browser. They are not yet synced to other devices.
        </p>
      </section>
    </div>
  );
}