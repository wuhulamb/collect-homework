const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('status');
let selectedFile = null;

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    handleFile(fileInput.files[0]);
  }
});

function handleFile(file) {
  selectedFile = file;
  fileInfo.textContent = `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  submitBtn.disabled = false;
  status.className = '';
  status.textContent = '';
}

submitBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  if (selectedFile.size > 100 * 1024 * 1024) {
    showStatus('error', '文件超过 100MB 大小限制');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);

  showStatus('', '上传中...');

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      showStatus('success', '上传成功: ' + data.filename);
    } else {
      showStatus('error', '上传失败: ' + (data.error || res.statusText));
    }
  } catch {
    showStatus('error', '网络错误，上传失败');
  }
});

function showStatus(type, msg) {
  status.className = type;
  status.textContent = msg;
}