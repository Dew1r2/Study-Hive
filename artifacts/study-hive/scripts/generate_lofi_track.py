from array import array
from math import exp, pi, sin, tanh
from pathlib import Path
import random
import wave


SAMPLE_RATE = 22050
BPM = 78
BEATS_PER_BAR = 4
BAR_COUNT = 16
SECONDS_PER_BEAT = 60 / BPM
DURATION = BAR_COUNT * BEATS_PER_BAR * SECONDS_PER_BEAT
FRAME_COUNT = int(SAMPLE_RATE * DURATION)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio" / "study-hive-lofi-loop.wav"
RNG = random.Random(41)

left = [0.0] * FRAME_COUNT
right = [0.0] * FRAME_COUNT


def add_note(frequency, start, length, amplitude, pan=0.0, voice="keys"):
    start_frame = max(0, int(start * SAMPLE_RATE))
    end_frame = min(FRAME_COUNT, int((start + length) * SAMPLE_RATE))
    left_gain = (1 - pan) * 0.5
    right_gain = (1 + pan) * 0.5

    for frame in range(start_frame, end_frame):
        age = (frame - start_frame) / SAMPLE_RATE
        if voice == "bass":
            envelope = (1 - exp(-age * 45)) * exp(-age * 1.8)
            phase = 2 * pi * frequency * age
            sample = sin(phase) * 0.82 + sin(phase * 2) * 0.12
        else:
            envelope = (1 - exp(-age * 32)) * exp(-age * 3.2)
            phase = 2 * pi * frequency * age
            sample = (
                sin(phase)
                + 0.24 * sin(phase * 2 + 0.08)
                + 0.08 * sin(phase * 3 + 0.16)
            )
            sample += 0.14 * sin(phase * 1.003)

        value = sample * envelope * amplitude
        left[frame] += value * left_gain
        right[frame] += value * right_gain


def add_kick(start, amplitude=0.3):
    start_frame = int(start * SAMPLE_RATE)
    length = 0.24
    end_frame = min(FRAME_COUNT, start_frame + int(length * SAMPLE_RATE))
    for frame in range(start_frame, end_frame):
        age = (frame - start_frame) / SAMPLE_RATE
        frequency = 100 - 55 * min(age / length, 1)
        phase = 2 * pi * (frequency * age + 30 * age * age / length)
        value = sin(phase) * exp(-age * 15) * amplitude
        left[frame] += value * 0.5
        right[frame] += value * 0.5


def add_noise_hit(start, length, amplitude, decay, high_pass=False, pan=0.0):
    start_frame = int(start * SAMPLE_RATE)
    end_frame = min(FRAME_COUNT, start_frame + int(length * SAMPLE_RATE))
    previous = 0.0
    left_gain = (1 - pan) * 0.5
    right_gain = (1 + pan) * 0.5

    for frame in range(start_frame, end_frame):
        age = (frame - start_frame) / SAMPLE_RATE
        noise = RNG.uniform(-1, 1)
        filtered = noise - previous if high_pass else noise
        previous = noise
        value = filtered * exp(-age * decay) * amplitude
        left[frame] += value * left_gain
        right[frame] += value * right_gain


def add_melody_note(midi, start, amplitude=0.065, pan=0.0):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    add_note(frequency, start, 0.72, amplitude, pan)


chords = [
    # Gmaj7, Em7, Cmaj7, D6. Notes are MIDI numbers for compact voicings.
    [55, 62, 66, 71],
    [52, 59, 62, 67],
    [48, 55, 59, 64],
    [50, 57, 59, 66],
]
arpeggios = [71, 66, 62, 66]
melody_scale = [74, 76, 79, 81, 83, 86]
bass_roots = [43, 40, 36, 38]

for bar in range(BAR_COUNT):
    bar_start = bar * BEATS_PER_BAR * SECONDS_PER_BEAT
    chord = chords[bar % len(chords)]

    for note_index, midi in enumerate(chord):
        frequency = 440 * 2 ** ((midi - 69) / 12)
        add_note(
            frequency,
            bar_start + 0.015 * note_index,
            2.8,
            0.13 if note_index == 0 else 0.085,
            pan=(note_index - 1.5) * 0.14,
        )

    for beat in range(BEATS_PER_BAR):
        beat_time = bar_start + beat * SECONDS_PER_BEAT
        arp_midi = arpeggios[(beat + bar) % len(arpeggios)]
        if bar % 2:
            arp_midi -= 12
        add_melody_note(arp_midi, beat_time + 0.045, 0.047, -0.15 if beat % 2 else 0.12)

        if beat in (0, 2):
            bass_midi = bass_roots[bar % len(bass_roots)]
            if beat == 2:
                bass_midi += 7
            bass_frequency = 440 * 2 ** ((bass_midi - 69) / 12)
            add_note(bass_frequency, beat_time, 0.9, 0.2, voice="bass")
            add_kick(beat_time, 0.27 if beat == 0 else 0.21)
        else:
            add_noise_hit(beat_time, 0.2, 0.095, 18, high_pass=True)

    for eighth in range(BEATS_PER_BAR * 2):
        hat_time = bar_start + eighth * SECONDS_PER_BEAT / 2
        strength = 0.018 if eighth % 2 == 0 else 0.036
        add_noise_hit(hat_time, 0.045, strength, 72, high_pass=True, pan=0.12)

    # A sparse, soft melody keeps the loop from feeling like a metronome.
    if bar % 2 == 0:
        melody_index = (bar * 3 + 1) % len(melody_scale)
        melody_start = bar_start + 2.5 * SECONDS_PER_BEAT
        add_melody_note(
            melody_scale[melody_index],
            melody_start,
            0.06,
            0.25 if bar % 4 == 0 else -0.2,
        )

    if bar % 4 == 3:
        add_noise_hit(
            bar_start + 3.5 * SECONDS_PER_BEAT,
            0.055,
            0.028,
            48,
            high_pass=True,
            pan=-0.1,
        )

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
stereo = array("h")
fade_frames = int(SAMPLE_RATE * 0.035)
peak = 0.0
for frame in range(FRAME_COUNT):
    peak = max(peak, abs(left[frame]), abs(right[frame]))
gain = min(0.82 / peak, 1.0) if peak else 1.0

for frame in range(FRAME_COUNT):
    fade = min(1.0, frame / fade_frames, (FRAME_COUNT - frame - 1) / fade_frames)
    for channel in (left[frame], right[frame]):
        value = tanh(channel * gain * 1.15) * fade
        stereo.append(int(max(-1.0, min(1.0, value)) * 32767))

if stereo.itemsize != 2:
    stereo.byteswap()

with wave.open(str(OUTPUT), "wb") as audio_file:
    audio_file.setnchannels(2)
    audio_file.setsampwidth(2)
    audio_file.setframerate(SAMPLE_RATE)
    audio_file.writeframes(stereo.tobytes())

print(f"Wrote {OUTPUT} ({DURATION:.1f}s)")