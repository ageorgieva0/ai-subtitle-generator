from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from faster_whisper import WhisperModel
from deep_translator import GoogleTranslator
import subprocess, uuid, os, shutil

app = FastAPI()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

model = WhisperModel("large-v3", device="cpu", compute_type="int8")

def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def hex_to_ass_color(hex_color):
    """Converts Web Hex (#RRGGBB) to FFmpeg ASS format (&H00BBGGRR)."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return "&H00FFFFFF" 
    r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
    return f"&H00{b}{g}{r}".upper()

@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    audio_language: str = Form("en"),
    subtitle_language: str = Form("en"),  # <--- Add this line
    font_name: str = Form("Arial"),
    font_size: int = Form(24),
    text_color: str = Form("#FFFFFF"),
    outline_color: str = Form("#000000")
):
    job_id = str(uuid.uuid4())

    video_path = os.path.abspath(f"{UPLOAD_DIR}/{job_id}.mp4")
    audio_path = os.path.abspath(f"{UPLOAD_DIR}/{job_id}.wav")
    srt_path = os.path.abspath(f"{UPLOAD_DIR}/{job_id}.srt")
    output_video = os.path.abspath(f"{UPLOAD_DIR}/{job_id}_subbed.mp4")

    with open(video_path, "wb") as f:
        f.write(await file.read())

    subprocess.run(["ffmpeg", "-y", "-i", video_path, "-ar", "16000", "-ac", "1", audio_path])

    segments, _ = model.transcribe(audio_path, language=audio_language, beam_size=5)
    segments = list(segments)

    translator = None
    if audio_language != subtitle_language:
        translator = GoogleTranslator(source=audio_language, target=subtitle_language)

    with open(srt_path, "w", encoding="utf-8") as srt:
        for i, seg in enumerate(segments, 1):
            original_text = seg.text.strip()
            
            if translator:
                try:
                    display_text = translator.translate(original_text)
                except Exception as e:
                    print(f"Translation error: {e}")
                    display_text = original_text
            else:
                display_text = original_text

            srt.write(f"{i}\n{format_time(seg.start)} --> {format_time(seg.end)}\n{display_text}\n\n")

    ass_text_color = hex_to_ass_color(text_color)
    ass_outline_color = hex_to_ass_color(outline_color)
    style = (f"Fontname={font_name},Fontsize={font_size},"
             f"PrimaryColour={ass_text_color},OutlineColour={ass_outline_color},"
             f"BorderStyle=1,Outline=1,Shadow=0,MarginV=20")

    result_video = subprocess.run(
        [
            "ffmpeg", "-y", 
            "-i", video_path,
            "-vf", f"subtitles='{srt_path}':force_style='{style}'", 
            "-c:v", "libx264",
            "-preset", "fast",
            "-c:a", "copy",              
            output_video
        ],
        capture_output=True, 
        text=True
    )

    response = {"download_srt": f"/download/srt/{job_id}"}
    if os.path.exists(output_video):
        response["download_video"] = f"/download/video/{job_id}"
    else:
        print("FFMPEG ERROR:", result_video.stderr)
        response["error"] = "FFmpeg processing failed."
    
    return response

@app.get("/download/video/{job_id}")
async def download_video(job_id: str):
    path = os.path.abspath(f"{UPLOAD_DIR}/{job_id}_subbed.mp4")
    return FileResponse(path, media_type='video/mp4', filename="video_with_subs.mp4")

@app.get("/download/srt/{job_id}")
async def download_srt(job_id: str):
    path = os.path.abspath(f"{UPLOAD_DIR}/{job_id}.srt")
    return FileResponse(path, media_type='application/x-subrip', filename="subtitles.srt")

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")