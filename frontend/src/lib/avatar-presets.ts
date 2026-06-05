export type AvatarPresetId =
  | "brain-blue"
  | "aurora"
  | "sunset"
  | "forest"
  | "ocean"
  | "rose"
  | "slate"
  | "gold";

export interface AvatarPreset {
  id: AvatarPresetId;
  label: string;
  className: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "brain-blue", label: "Brain Blue", className: "bg-gradient-to-br from-blue-600 to-indigo-700" },
  { id: "aurora", label: "Aurora", className: "bg-gradient-to-br from-cyan-500 to-violet-600" },
  { id: "sunset", label: "Sunset", className: "bg-gradient-to-br from-orange-500 to-rose-600" },
  { id: "forest", label: "Forest", className: "bg-gradient-to-br from-emerald-600 to-teal-800" },
  { id: "ocean", label: "Ocean", className: "bg-gradient-to-br from-sky-500 to-blue-800" },
  { id: "rose", label: "Rose", className: "bg-gradient-to-br from-pink-500 to-fuchsia-700" },
  { id: "slate", label: "Slate", className: "bg-gradient-to-br from-slate-500 to-slate-800" },
  { id: "gold", label: "Gold", className: "bg-gradient-to-br from-amber-500 to-orange-700" },
];

export const DEFAULT_AVATAR_PRESET: AvatarPresetId = "brain-blue";

export function getAvatarPreset(id?: string | null): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}

export function getUserInitials(firstName?: string, lastName?: string, fallback = "U"): string {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";
  const combined = `${first}${last}`.toUpperCase();
  return combined || fallback.charAt(0).toUpperCase();
}
