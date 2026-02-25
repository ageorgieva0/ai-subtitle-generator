const audioSelect = document.getElementById("audio_language");
const subSelect = document.getElementById("subtitle_language");
const fontSelect = document.getElementById('fontSelect');
const form = document.getElementById("form");
const API_KEY = 'AIzaSyCUmiv3PoktPt_ynOGYmCloCc18vCkMDI4'; 

// --- TRANSLATION DATA ---
const uiTranslations = {
    en: { preview: "Subtitle Preview", dir: "ltr" },
    bg: { preview: "Пример за субтитри", dir: "ltr" },
    es: { preview: "Vista previa", dir: "ltr" },
    fr: { preview: "Aperçu", dir: "ltr" },
    de: { preview: "Vorschau", dir: "ltr" },
    it: { preview: "Anteprima", dir: "ltr" },
    pt: { preview: "Prévia", dir: "ltr" },
    ru: { preview: "Предпросмотр", dir: "ltr" },
    zh: { preview: "预览", dir: "ltr" },
    ja: { preview: "プレビュー", dir: "ltr" },
    hi: { preview: "पूर्वावलोकन", dir: "ltr" },
    ar: { preview: "معاينة", dir: "rtl" },
    he: { preview: "תצוגה מקדימה", dir: "rtl" },
    tr: { preview: "Altyazı Önizleme", dir: "ltr" },
    uk: { preview: "Попередній перегляд", dir: "ltr" },
    pl: { preview: "Podgląd napisów", dir: "ltr" },
    nl: { preview: "Voorbeeld ondertitels", dir: "ltr" },
    ko: { preview: "자막 미리보기", dir: "ltr" },
    sv: { preview: "Förhandsgranska", dir: "ltr" },
    th: { preview: "ดูตัวอย่างคำบรรยาย", dir: "ltr" },
    vi: { preview: "Xem trước phụ đề", dir: "ltr" },
    el: { preview: "Προεπισκόπηση", dir: "ltr" },
    ro: { preview: "Previzualizare", dir: "ltr" },
    hu: { preview: "Felirat előnézet", dir: "ltr" },
    da: { preview: "Forhåndsvisning", dir: "ltr" },
    fi: { preview: "Tekstityksen esikatselu", dir: "ltr" },
    no: { preview: "Forhåndsvisning", dir: "ltr" },
    cs: { preview: "Náhled titulků", dir: "ltr" },
    sk: { preview: "Náhľad titulkov", dir: "ltr" },
    id: { preview: "Pratinjau subtitle", dir: "ltr" },
    fa: { preview: "پیش‌نمایش زیرنویس", dir: "rtl" },
    ms: { preview: "Pratonton sarikata", dir: "ltr" }
};

const whisperLanguages = {
    "en": "English", "bg": "Български", "es": "Español", "fr": "Français", "de": "Deutsch", "it": "Italiano", "pt": "Português", "ru": "Русский", "zh": "中文", "ja": "日本語", "hi": "हिन्दी", "ar": "العربية", "he": "עברית", "tr": "Türkçe", "uk": "Українська", "pl": "Polski", "nl": "Nederlands", "ko": "한국어", "sv": "Svenska", "th": "ไทย", "vi": "Tiếng Việt", "el": "Ελληνικά", "ro": "Română", "hu": "Magyar", "da": "Dansk", "fi": "Suomi", "no": "Norsk", "cs": "Čeština", "sk": "Slovenčina", "id": "Bahasa Indonesia", "fa": "فارسی", "ms": "Bahasa Melayu"
};

// --- FUNCTIONS ---

function populateLanguages() {
    for (const [code, name] of Object.entries(whisperLanguages)) {
        audioSelect.add(new Option(name, code));
        subSelect.add(new Option(name, code));
    }
    audioSelect.value = "en";
    subSelect.value = "bg";
}

function updatePreview() {
    const preview = document.getElementById("previewText");
    const subLang = subSelect.value;
    const font = fontSelect.value;
    const size = document.getElementById("font_size").value;
    const tColor = document.getElementById("text_color").value;
    const oColor = document.getElementById("outline_color").value;

    // Change text and direction based on language
    const translation = uiTranslations[subLang] || uiTranslations['en'];
    preview.textContent = translation.preview;
    preview.style.direction = translation.dir;

    // Apply styles
    preview.style.fontFamily = `"${font}", sans-serif`;
    preview.style.fontSize = size + "px";
    preview.style.color = tColor;
    preview.style.textShadow = `-1px -1px 0 ${oColor}, 1px -1px 0 ${oColor}, -1px 1px 0 ${oColor}, 1px 1px 0 ${oColor}`;
}

async function loadGoogleFonts() {
    try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${API_KEY}`);
        const data = await response.json();
        fontSelect.innerHTML = '';
        data.items.slice(0, 50).forEach(font => {
            fontSelect.appendChild(new Option(font.family, font.family));
        });
        updatePreview();
    } catch (error) {
        fontSelect.innerHTML = '<option value="Arial">Arial</option>';
    }
}

// --- EVENT LISTENERS ---

// Updates preview when language changes
subSelect.addEventListener("change", updatePreview);

// Updates preview and loads font file when font changes
fontSelect.addEventListener('change', () => {
    const selectedFont = fontSelect.value;
    const fontId = `font-link-${selectedFont.replace(/\s+/g, '-')}`;
    
    if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, '+')}&display=swap`;
        document.head.appendChild(link);
    }
    updatePreview();
});

// Updates preview for size and colors
[document.getElementById("font_size"), document.getElementById("text_color"), document.getElementById("outline_color")].forEach(el => {
    el.addEventListener("input", updatePreview);
});

form.onsubmit = (e) => {
    e.preventDefault();
    
    // Check if a file is actually selected
    const fileInput = document.getElementById("file");
    if (!fileInput.files[0]) {
        alert("Please select a video file first!");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("audio_language", audioSelect.value);
    formData.append("subtitle_language", subSelect.value); // Uses the subSelect variable defined at top
    formData.append("font_name", fontSelect.value);
    formData.append("font_size", document.getElementById("font_size").value);
    formData.append("text_color", document.getElementById("text_color").value);
    formData.append("outline_color", document.getElementById("outline_color").value);

    // UI Feedback
    document.getElementById("progress-container").style.display = "block";
    document.getElementById("links").innerHTML = "";
    
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            document.getElementById("progressBar").value = pct;
            document.getElementById("status").textContent = `Uploading: ${pct}%`;
            if (pct === 100) {
                document.getElementById("status").textContent = "AI Processing... This may take a minute.";
            }
        }
    };

    // Handle the server response
    xhr.onload = () => {
        if (xhr.status === 200) {
            try {
                const resp = JSON.parse(xhr.responseText);
                document.getElementById("status").textContent = "Done!";
                document.getElementById("links").innerHTML = `
                    <a href="${resp.download_video}" target="_blank">⬇ Download Subtitled Video</a>
                    <a href="${resp.download_srt}" target="_blank">⬇ Download SRT File</a>
                `;
            } catch (err) {
                document.getElementById("status").textContent = "Error parsing server response.";
            }
        } else {
            document.getElementById("status").textContent = "Server Error: " + xhr.status;
        }
    };

    xhr.onerror = () => {
        document.getElementById("status").textContent = "Connection failed.";
    };

    xhr.open("POST", "/upload");
    xhr.send(formData);
};

// --- INITIALIZE ---
populateLanguages();
loadGoogleFonts();