from array import array
from math import exp, pi, sin, tanh
from pathlib import Path
import random
import wave


SAMPLE_RATE = 22050
DURATION = 60
FRAME_COUNT = SAMPLE_RATE * DURATION
OUTPUT_DIR = Path("/tmp/study-hive-ambience")

TRACKS = [
    {
        "filename": "study-hive-rain-window.wav",
        "seed": 117,
        "rain_density": 32,
        "rain_bed": 0.82,
        "drop_gain": 0.95,
        "piano_gain": 0.023,
        "room_gain": 0.0,
        "birds": False,
    },
    {
        "filename": "study-hive-forest-drizzle.wav",
        "seed": 229,
        "rain_density": 23,
        "rain_bed": 0.66,
        "drop_gain": 0.72,
        "piano_gain": 0.019,
        "room_gain": 0.0,
        "birds": True,
    },
    {
        "filename": "study-hive-quiet-cafe.wav",
        "seed": 331,
        "rain_density": 18,
        "rain_bed": 0.56,
        "drop_gain": 0.6,
        "piano_gain": 0.022,
        "room_gain": 0.34,
        "birds": False,
    },
    {
        "filename": "study-hive-night-rain.wav",
        "seed": 443,
        "rain_density": 17,
        "rain_bed": 0.7,
        "drop_gain": 0.55,
        "piano_gain": 0.018,
        "room_gain": 0.08,
        "birds": False,
    },
    {
        "filename": "study-hive-soft-piano.wav",
        "seed": 557,
        "rain_density": 0,
        "rain_bed": 0.0,
        "drop_gain": 0.0,
        "piano_gain": 0.042,
        "room_gain": 0.12,
        "birds": False,
    },
]

CHORDS = [
    [55, 59, 62, 67],  # G gentle voicing
    [52, 55, 59, 64],  # E minor
    [48, 55, 59, 64],  # C major
    [50, 57, 59, 64],  # D suspended
]


def add_soft_key(left, right, frequency, start, length, amplitude, pan, phase):
    first = max(0, int(start * SAMPLE_RATE))
    last = min(FRAME_COUNT, int((start + length) * SAMPLE_RATE))
    left_gain = (1 - pan) * 0.5
    right_gain = (1 + pan) * 0.5

    for frame in range(first, last):
        age = (frame - first) / SAMPLE_RATE
        attack = 1 - exp(-age * 3.2)
        release = min(1.0, max(0.0, (length - age) / 0.7))
        envelope = attack * exp(-age * 0.34) * release
        angle = 2 * pi * frequency * age + phase
        tone = sin(angle) * 0.84 + sin(angle * 2 + 0.08) * 0.12
        tone += sin(angle * 0.5 + 0.2) * 0.05
        value = tone * envelope * amplitude
        left[frame] += value * left_gain
        right[frame] += value * right_gain


def add_rain_bed(left, right, rng, strength, room_strength):
    low_l = low_r = mid_l = mid_r = room_l = room_r = 0.0
    for frame in range(FRAME_COUNT):
        raw_l = rng.uniform(-1, 1)
        raw_r = rng.uniform(-1, 1)
        low_l += (raw_l - low_l) * 0.018
        low_r += (raw_r - low_r) * 0.018
        mid_l += (raw_l - mid_l) * 0.12
        mid_r += (raw_r - mid_r) * 0.12
        room_l += (raw_l - room_l) * 0.003
        room_r += (raw_r - room_r) * 0.003

        rain_l = (low_l * 0.42 + mid_l * 0.34 + raw_l * 0.055) * strength
        rain_r = (low_r * 0.42 + mid_r * 0.34 + raw_r * 0.055) * strength
        left[frame] += rain_l + room_l * room_strength
        right[frame] += rain_r + room_r * room_strength


def add_raindrops(left, right, rng, density, strength):
    count = int(DURATION * density)
    for _ in range(count):
        start = rng.randrange(0, FRAME_COUNT - int(SAMPLE_RATE * 0.13))
        length = rng.uniform(0.025, 0.12)
        decay = rng.uniform(34, 88)
        amplitude = rng.uniform(0.045, 0.14) * strength
        if rng.random() < 0.08:
            amplitude *= 1.5
        pan = rng.uniform(-0.88, 0.88)
        left_gain = (1 - pan) * 0.5
        right_gain = (1 + pan) * 0.5
        resonant_frequency = rng.uniform(850, 2600)
        phase = rng.uniform(0, 2 * pi)
        filtered = 0.0
        last = min(FRAME_COUNT, start + int(length * SAMPLE_RATE))

        for frame in range(start, last):
            age = (frame - start) / SAMPLE_RATE
            noise = rng.uniform(-1, 1)
            filtered += (noise - filtered) * 0.24
            envelope = exp(-age * decay)
            resonance = sin(2 * pi * resonant_frequency * age + phase)
            splash = filtered * 0.76 + noise * 0.12 + resonance * 0.12
            value = splash * envelope * amplitude
            left[frame] += value * left_gain
            right[frame] += value * right_gain


def add_birds(left, right, rng):
    for start in (8.5, 21.0, 38.5, 51.0):
        start += rng.uniform(-1.3, 1.3)
        first = int(start * SAMPLE_RATE)
        length = 0.52
        last = min(FRAME_COUNT, first + int(length * SAMPLE_RATE))
        pan = rng.uniform(-0.7, 0.7)

        for frame in range(first, last):
            age = (frame - first) / SAMPLE_RATE
            rise_fall = sin(pi * age / length) ** 2
            frequency = 1850 + 580 * age / length
            value = sin(2 * pi * frequency * age) * rise_fall * 0.009
            left[frame] += value * (1 - pan) * 0.5
            right[frame] += value * (1 + pan) * 0.5


def add_piano(left, right, rng, strength):
    chord_duration = 7.5
    for chord_index in range(8):
        start = chord_index * chord_duration
        chord = CHORDS[chord_index % len(CHORDS)]
        for note_index, midi in enumerate(chord):
            frequency = 440 * 2 ** ((midi - 69) / 12)
            pan = (note_index - 1.5) * 0.18
            phase = rng.uniform(-0.2, 0.2)
            add_soft_key(
                left,
                right,
                frequency,
                start + note_index * 0.035,
                8.8,
                strength * (0.72 if note_index == 0 else 0.5),
                pan,
                phase,
            )

        # A single soft upper note adds a little movement without a beat.
        upper = chord[-1] + (12 if chord_index % 2 == 0 else 7)
        add_soft_key(
            left,
            right,
            440 * 2 ** ((upper - 69) / 12),
            start + 3.9,
            4.4,
            strength * 0.23,
            rng.uniform(-0.22, 0.22),
            rng.uniform(-0.2, 0.2),
        )


def render_track(track):
    rng = random.Random(track["seed"])
    left = [0.0] * FRAME_COUNT
    right = [0.0] * FRAME_COUNT

    if track["rain_bed"] or track["room_gain"]:
        add_rain_bed(
            left,
            right,
            rng,
            track["rain_bed"],
            track["room_gain"],
        )
        if track["room_gain"]:
            # A low, quiet room tone; no voices or sharp cafe sounds.
            for frame in range(FRAME_COUNT):
                age = frame / SAMPLE_RATE
                hum = (
                    sin(2 * pi * 110 * age) * 0.38
                    + sin(2 * pi * 164.8 * age) * 0.22
                )
                left[frame] += hum * track["room_gain"] * 0.018
                right[frame] += hum * track["room_gain"] * 0.017

    if track["rain_density"]:
        add_raindrops(
            left,
            right,
            rng,
            track["rain_density"],
            track["drop_gain"],
        )

    if track["birds"]:
        add_birds(left, right, rng)

    if track["piano_gain"]:
        add_piano(left, right, rng, track["piano_gain"])

    peak = max(max(abs(value) for value in left), max(abs(value) for value in right))
    gain = min(0.78 / peak, 1.2) if peak else 1.0
    fade_frames = int(SAMPLE_RATE * 0.16)
    stereo = array("h")

    for frame in range(FRAME_COUNT):
        fade = min(
            1.0,
            frame / fade_frames,
            (FRAME_COUNT - frame - 1) / fade_frames,
        )
        for channel in (left[frame], right[frame]):
            value = tanh(channel * gain * 1.12) * fade
            stereo.append(int(max(-1.0, min(1.0, value)) * 32767))

    if stereo.itemsize != 2:
        stereo.byteswap()

    output = OUTPUT_DIR / track["filename"]
    with wave.open(str(output), "wb") as audio_file:
        audio_file.setnchannels(2)
        audio_file.setsampwidth(2)
        audio_file.setframerate(SAMPLE_RATE)
        audio_file.writeframes(stereo.tobytes())

    print(f"Wrote {output}")


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
for ambient_track in TRACKS:
    render_track(ambient_track)