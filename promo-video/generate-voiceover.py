"""
Generate voiceover audio for NaijaTransfer promo video using MeloTTS (OpenVoice V2 base).
Produces natural-sounding English speech with no voice overlay between scenes.

Usage: conda run -n openvoice python generate-voiceover.py
"""

import os
import torch
from melo.api import TTS

OUTPUT_DIR = "public/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# MeloTTS supports: EN, ES, FR, ZH, JP, KR
# Use English with American accent for clear, professional voice
device = "cpu"  # Use "cuda" if GPU available
speed = 0.95  # Slightly slower for clarity

# Voiceover scenes — each scene gets its own audio file (no overlay)
scenes = [
    {
        "id": "vo-hook",
        "text": "Tired of WhatsApp destroying your files? Email caps you at just twenty-five megabytes.",
    },
    {
        "id": "vo-problem",
        "text": "Photos lose quality. Videos get crushed. Large files? Forget it. And Nigerian internet makes it worse.",
    },
    {
        "id": "vo-comparison",
        "text": "WhatsApp, Email, WeTransfer. They all fall short. NaijaTransfer is the clear winner.",
    },
    {
        "id": "vo-reveal",
        "text": "Introducing NaijaTransfer.",
    },
    {
        "id": "vo-showcase",
        "text": "Upload up to four gigabytes completely free. No account needed. Resumable uploads built for Nigerian internet.",
    },
    {
        "id": "vo-security",
        "text": "Password protection. WhatsApp sharing. Auto expiry. And your files stay in original quality. Always.",
    },
    {
        "id": "vo-nigeria",
        "text": "Built in Nigeria, for Nigeria. All prices in Naira. Free forever. Pro from just two thousand Naira a month.",
    },
    {
        "id": "vo-cta",
        "text": "Visit naijatransfer dot com. Send files for free. No account. No wahala.",
    },
]

def main():
    print("Loading MeloTTS model...")
    model = TTS(language="EN", device=device)

    # Get available speaker IDs
    speaker_ids = model.hps.data.spk2id
    print(f"Available speakers: {speaker_ids}")

    # Use EN-US (American English) for a clear, professional voice
    # Available: EN-US, EN-BR (British), EN-AU (Australian), EN-Default
    speaker_key = "EN-US"
    if speaker_key not in speaker_ids:
        speaker_key = list(speaker_ids.keys())[0]
    speaker_id = speaker_ids[speaker_key]
    print(f"Using speaker: {speaker_key} (id={speaker_id})")

    for scene in scenes:
        out_path = os.path.join(OUTPUT_DIR, f"{scene['id']}.mp3")
        print(f"Generating: {scene['id']}...")

        # Generate speech — outputs WAV, we convert to MP3 path
        # MeloTTS output_path determines format by extension
        wav_path = out_path.replace(".mp3", ".wav")
        model.tts_to_file(
            scene["text"],
            speaker_id,
            wav_path,
            speed=speed,
        )

        # Convert WAV to MP3 using ffmpeg for smaller file size
        os.system(f'ffmpeg -i "{wav_path}" -codec:a libmp3lame -qscale:a 2 "{out_path}" -y -loglevel quiet')
        os.remove(wav_path)

        file_size = os.path.getsize(out_path) / 1024
        print(f"  Saved: {out_path} ({file_size:.1f} KB)")

    print("\nAll voiceovers generated!")
    print("Now run: cd promo-video && npx remotion render NaijaTransferPromo out/naijatransfer-promo-v2.mp4")

if __name__ == "__main__":
    main()
