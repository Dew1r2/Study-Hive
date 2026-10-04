import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@clerk/react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Link } from "wouter";
import {
  defaultStudyHiveProfile,
  profileAvatars,
  readStudyHiveProfile,
  type ProfileEffect,
  type StudyHiveProfile,
} from "@/lib/study-hive-profile";

const effectOptions: { value: ProfileEffect; label: string; detail: string }[] =
  [
    { value: "moss", label: "Moss glow", detail: "A quiet green edge" },
    { value: "honey", label: "Honey spark", detail: "A warm golden shimmer" },
    { value: "notebook", label: "Notebook", detail: "A hand-drawn dashed frame" },
  ];

export default function ProfilePage() {
  const { isLoaded, user } = useUser();
  const [draft, setDraft] = useState<StudyHiveProfile>(
    defaultStudyHiveProfile,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setDraft(
      readStudyHiveProfile(
        user.unsafeMetadata,
        user.firstName || defaultStudyHiveProfile.displayName,
      ),
    );
  }, [user]);

  const updateDraft = <K extends keyof StudyHiveProfile>(
    key: K,
    value: StudyHiveProfile[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError("");
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError("");

    const profile = {
      ...draft,
      displayName:
        draft.displayName.trim().slice(0, 32) ||
        defaultStudyHiveProfile.displayName,
      bio: draft.bio.trim().slice(0, 160),
      status: draft.status.trim().slice(0, 48),
    };

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          studyHiveProfile: profile,
        },
      });
      setDraft(profile);
      setSaved(true);
    } catch {
      setError("Your profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="hive-card p-6 text-sm text-muted-foreground">
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard"
        className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to your study desk
      </Link>
      <header className="mt-5 max-w-2xl">
        <p className="eyebrow">Your corner of the hive</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Make your profile yours.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Pick a science avatar, write a short intro, and choose a little profile
          effect.
        </p>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.92fr]">
        <form onSubmit={saveProfile} className="hive-card space-y-5 p-5 sm:p-7">
          <div>
            <label
              htmlFor="profile-display-name"
              className="mb-2 block text-sm font-semibold"
            >
              Display name
            </label>
            <input
              id="profile-display-name"
              value={draft.displayName}
              onChange={(event) =>
                updateDraft("displayName", event.target.value)
              }
              maxLength={32}
              autoComplete="nickname"
              className="focus-ring h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              data-testid="input-profile-display-name"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold">Avatar</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an avatar">
              {profileAvatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => updateDraft("avatar", avatar)}
                  aria-label={`Choose ${avatar} avatar`}
                  aria-pressed={draft.avatar === avatar}
                  className={`focus-ring flex h-12 w-12 items-center justify-center rounded-xl border text-2xl transition-colors ${
                    draft.avatar === avatar
                      ? "border-primary bg-primary/15"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                  data-testid={`button-avatar-${profileAvatars.indexOf(avatar)}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-status"
              className="mb-2 block text-sm font-semibold"
            >
              Study status
            </label>
            <input
              id="profile-status"
              value={draft.status}
              onChange={(event) => updateDraft("status", event.target.value)}
              maxLength={48}
              placeholder="What are you working on?"
              className="focus-ring h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              data-testid="input-profile-status"
            />
          </div>

          <div>
            <label
              htmlFor="profile-bio"
              className="mb-2 block text-sm font-semibold"
            >
              About me
            </label>
            <textarea
              id="profile-bio"
              value={draft.bio}
              onChange={(event) => updateDraft("bio", event.target.value)}
              maxLength={160}
              rows={4}
              placeholder="A little about what you like learning…"
              className="focus-ring w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6"
              data-testid="textarea-profile-bio"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {draft.bio.length}/160
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              Profile effect
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {effectOptions.map((effect) => (
                <button
                  key={effect.value}
                  type="button"
                  onClick={() => updateDraft("effect", effect.value)}
                  aria-pressed={draft.effect === effect.value}
                  className={`focus-ring rounded-xl border p-3 text-left transition-colors ${
                    draft.effect === effect.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                  data-testid={`button-profile-effect-${effect.value}`}
                >
                  <span className="block text-sm font-semibold">
                    {effect.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {effect.detail}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div aria-live="polite" className="text-sm">
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Check size={15} /> Profile saved
                </span>
              )}
              {error && <span className="text-destructive">{error}</span>}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground disabled:opacity-60"
              data-testid="button-save-profile"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div
            className={`profile-preview profile-effect-${draft.effect} rounded-3xl border bg-card p-6`}
            data-testid="profile-preview"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow">Profile preview</span>
              <Sparkles size={17} className="text-secondary" />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="profile-avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-background text-4xl">
                {draft.avatar}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold">
                  {draft.displayName || defaultStudyHiveProfile.displayName}
                </h2>
                <p className="mt-1 truncate text-sm text-primary">
                  {draft.status || "Ready to learn"}
                </p>
              </div>
            </div>
            <p className="mt-5 min-h-12 text-sm leading-6 text-muted-foreground">
              {draft.bio || "Your short intro will show up here."}
            </p>
            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Study Hive learner
            </div>
          </div>
          <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-4 text-sm leading-6 text-muted-foreground">
            Your profile settings are attached to your signed-in account. Peer
            profile sharing remains off until classroom access is safely
            available.
          </div>
        </aside>
      </div>
    </div>
  );
}