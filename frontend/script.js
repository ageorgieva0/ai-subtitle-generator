const whisperLanguages = {
    "en": "English", "bg": "Български", "es": "Español", "fr": "Français", "de": "Deutsch", "it": "Italiano", "pt": "Português", "ru": "Русский", "zh": "中文", "ja": "日本語", "hi": "हिन्दी", "ar": "العربية", "tr": "Türkçe", "pl": "Polski"
};

const audioSelect = document.getElementById("audio_language");
const subSelect = document.getElementById("subtitle_language");

function populate() {
    for (const [code, name] of Object.entries(whisperLanguages)) {
        const opt1 = new Option(name, code);
        const opt2 = new Option(name, code);
        audioSelect.add(opt1);
        subSelect.add(opt2);
        if (code === "en") opt1.selected = true;
        if (code === "bg") opt2.selected = true;
    }
}

function updatePreview() {
    const preview = document.getElementById("previewText");
    preview.style.fontFamily = document.getElementById("font_name").value;
    preview.style.fontSize = document.getElementById("font_size").value + "px";
    preview.style.color = document.getElementById("text_color").value;
    const oColor = document.getElementById("outline_color").value;
    preview.style.textShadow = `-1px -1px 0 ${oColor}, 1px -1px 0 ${oColor}, -1px 1px 0 ${oColor}, 1px 1px 0 ${oColor}`;
}

[document.getElementById("font_name"), document.getElementById("font_size"), 
 document.getElementById("text_color"), document.getElementById("outline_color")].forEach(el => {
    el.addEventListener("input", updatePreview);
});

populate();
updatePreview();

const form = document.getElementById("form");
form.onsubmit = (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("file", document.getElementById("file").files[0]);
  formData.append("audio_language", audioSelect.value);
  formData.append("subtitle_language", subSelect.value);
  formData.append("font_name", document.getElementById("font_name").value);
  formData.append("font_size", document.getElementById("font_size").value);
  formData.append("text_color", document.getElementById("text_color").value);
  formData.append("outline_color", document.getElementById("outline_color").value);

  document.getElementById("progress-container").style.display = "block";
  document.getElementById("links").innerHTML = "";
  
  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      document.getElementById("progressBar").value = pct;
      document.getElementById("status").textContent = `Uploading: ${pct}%`;
      if (pct === 100) document.getElementById("status").textContent = "AI Processing & Translating...";
    }
  };
  xhr.onload = () => {
    if (xhr.status === 200) {
      const resp = JSON.parse(xhr.responseText);
      document.getElementById("status").textContent = "Done!";
      document.getElementById("links").innerHTML = `
        <a href="${resp.download_video}">⬇ Download Subtitled Video</a>
        <a href="${resp.download_srt}">⬇ Download SRT File</a>
      `;
    }
  };
  xhr.open("POST", "/upload");
  xhr.send(formData);
};