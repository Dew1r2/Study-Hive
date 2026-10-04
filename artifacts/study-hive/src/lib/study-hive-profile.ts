export type ProfileEffect = "moss" | "honey" | "notebook";

export type StudyHiveProfile = {
  displayName: string;
  bio: string;
  status: string;
  avatar: string;
  effect: ProfileEffect;
};

export const profileAvatars = ["🔬", "🧪", "🪴", "🦋", "🪐", "🍯"] as const;

export const defaultStudyHiveProfile: StudyHiveProfile = {
  displayName: "Curious learner",
  bio: "",
  status: "Ready to learn",
  avatar: profileAvatars[0],
  effect: "moss",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readStudyHiveProfile(
  metadata: unknown,
  fallbackName = defaultStudyHiveProfile.displayName,
): StudyHiveProfile {
  const root = isRecord(metadata) ? metadata : {};
  const saved = isRecord(root.studyHiveProfile) ? root.studyHiveProfile : {};
  const avatar =
    typeof saved.avatar === "string" &&
    profileAvatars.includes(saved.avatar as (typeof profileAvatars)[number])
      ? saved.avatar
      : defaultStudyHiveProfile.avatar;
  const effect =
    saved.effect === "moss" ||
    saved.effect === "honey" ||
    saved.effect === "notebook"
      ? saved.effect
      : defaultStudyHiveProfile.effect;

  return {
    displayName:
      typeof saved.displayName === "string" && saved.displayName.trim()
        ? saved.displayName
        : fallbackName,
    bio: typeof saved.bio === "string" ? saved.bio : "",
    status:
      typeof saved.status === "string"
        ? saved.status
        : defaultStudyHiveProfile.status,
    avatar,
    effect,
  };
}