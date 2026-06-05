"""Built-in profile picture presets (no image files required)."""

AVATAR_PRESET_CHOICES = [
    ("brain-blue", "Brain Blue"),
    ("aurora", "Aurora"),
    ("sunset", "Sunset"),
    ("forest", "Forest"),
    ("ocean", "Ocean"),
    ("rose", "Rose"),
    ("slate", "Slate"),
    ("gold", "Gold"),
]

VALID_AVATAR_PRESETS = {slug for slug, _ in AVATAR_PRESET_CHOICES}

DEFAULT_AVATAR_PRESET = "brain-blue"
