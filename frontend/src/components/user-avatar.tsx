import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DEFAULT_AVATAR_PRESET,
  getAvatarPreset,
  getUserInitials,
  type AvatarPresetId,
} from "@/lib/avatar-presets";
import { resolveMediaUrl, withCacheBust } from "@/lib/media-url";

export interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  avatarPreset?: string | null;
  cacheVersion?: string | number | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  avatarPreset,
  cacheVersion,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = getUserInitials(firstName, lastName);
  const resolvedUrl = resolveMediaUrl(avatarUrl);
  const imageSrc = resolvedUrl ? withCacheBust(resolvedUrl, cacheVersion) : undefined;
  const preset = getAvatarPreset(imageSrc ? null : (avatarPreset || DEFAULT_AVATAR_PRESET));

  return (
    <Avatar className={cn("shrink-0", className)}>
      {imageSrc ? (
        <AvatarImage
          key={imageSrc}
          src={imageSrc}
          alt={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "Profile"}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "font-semibold text-white",
          !imageSrc && preset.className,
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function PresetAvatarPreview({
  presetId,
  initials = "SA",
  selected,
  className,
  onClick,
}: {
  presetId: AvatarPresetId;
  initials?: string;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const preset = getAvatarPreset(presetId);
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition-all",
        preset.className,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105",
        onClick && "hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      title={preset.label}
      aria-label={preset.label}
      aria-pressed={selected}
    >
      {initials}
    </Comp>
  );
}
