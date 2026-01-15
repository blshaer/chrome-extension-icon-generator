let zip = new JSZip();

const inputImage = document.getElementById('inputImage');
const dragArea = document.getElementById('dragArea');
const outputImages = document.getElementById('outputImages');
const uploadTitle = document.getElementById('uploadTitle');
const uploadSubtitle = document.getElementById('uploadSubtitle');
const settingsArea = document.getElementById('settingsArea');
const borderRadiusInput = document.getElementById('borderRadius');
const borderRadiusValue = document.getElementById('borderRadiusValue');
const bgColorInput = document.getElementById('bgColor');
const transparentBtn = document.getElementById('transparentBtn');
let isTransparent = false;

dragArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragArea.style.backgroundColor = 'rgba(97, 175, 239, 0.3)';
});

dragArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragArea.style.backgroundColor = '';
});

let storedOriginalImage = null;

dragArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dragArea.style.backgroundColor = '';
  inputImage.files = e.dataTransfer.files;
  handleFileChange();
});

dragArea.addEventListener('click', (e) => {
  inputImage.click();
});

borderRadiusInput.addEventListener('input', (e) => {
  borderRadiusValue.innerText = e.target.value;
  if (storedOriginalImage) {
    generateImages(storedOriginalImage);
  }
});

bgColorInput.addEventListener('input', () => {
  isTransparent = false;
  if (storedOriginalImage) {
    generateImages(storedOriginalImage);
  }
});

transparentBtn.addEventListener('click', () => {
  isTransparent = true;
  if (storedOriginalImage) {
    generateImages(storedOriginalImage);
  }
});

const handleFileChange = () => {
  if (inputImage.files && inputImage.files[0]) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        storedOriginalImage = img;
        updateUIForUpload(inputImage.files[0].name);
        generateImages(img);
      };
    };
    reader.readAsDataURL(inputImage.files[0]);
  }
};



const previewArea = document.getElementById('previewArea');
const previewIcon = document.getElementById('previewIcon');
const popupIcon = document.getElementById('popupIcon');
const extensionPopup = document.getElementById('extensionPopup');

previewIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  extensionPopup.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!extensionPopup.classList.contains('hidden') && !extensionPopup.contains(e.target) && e.target !== previewIcon) {
    extensionPopup.classList.add('hidden');
  }
});

const removeFile = () => {
  inputImage.value = '';
  outputImages.innerHTML = '';
  uploadTitle.innerHTML = 'Upload file';
  uploadSubtitle.innerHTML = 'click or drag and drop your file here';
  dragArea.classList.remove('small');
  settingsArea.classList.add('hidden');
  previewArea.classList.add('hidden');
  document.getElementById('downloadAll').classList.add('hidden');
  document.getElementById('code-snippet').classList.add('hidden');
  storedOriginalImage = null;
  document.querySelector('link[rel="icon"][sizes="32x32"]').href = 'favicon/favicon-32x32.png';
  document.querySelector('link[rel="icon"][sizes="16x16"]').href = 'favicon/favicon-16x16.png';
};

const updateUIForUpload = (fileName) => {
  const downloadAllButton = document.getElementById('downloadAll');
  const codeSnippet = document.getElementById('code-snippet');

  uploadTitle.innerHTML = 'Click to change file';
  uploadSubtitle.innerHTML = fileName;
  dragArea.classList.add('small');
  settingsArea.classList.remove('hidden');
  previewArea.classList.remove('hidden'); // Show preview area
  downloadAllButton.classList.add('hidden'); // Initially hide until generated
  codeSnippet.classList.add('hidden');
};

const resizeImage = () => {
  handleFileChange(); // For backward compatibility if HTML calls resizeImage()
};

const generateImages = (img) => {
  const downloadAllButton = document.getElementById('downloadAll');
  const codeSnippet = document.getElementById('code-snippet');

  // Check if we can reuse existing elements to prevent scroll jumping
  const existingDivs = outputImages.querySelectorAll('div');
  const shouldReuse = existingDivs.length === 4; // We expect 4 sizes

  if (!shouldReuse) {
    outputImages.innerHTML = '';
  }

  zip = new JSZip();

  const sizes = [128, 48, 32, 16];
  const borderRadiusPercent = borderRadiusInput.value;

  sizes.forEach((size, index) => {
    const resizedImage = document.createElement('canvas');
    resizedImage.width = size;
    resizedImage.height = size;

    const ctx = resizedImage.getContext('2d');

    if (!isTransparent) {
      ctx.fillStyle = bgColorInput.value;
      ctx.fillRect(0, 0, size, size);
    }

    if (borderRadiusPercent > 0) {
      const radius = (size * borderRadiusPercent) / 100;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(img, 0, 0, size, size);

    const imageDataURL = resizedImage.toDataURL('image/png');

    if (size === 16) {
      previewIcon.src = imageDataURL;
      popupIcon.src = imageDataURL;
      document.querySelector('link[rel="icon"][sizes="16x16"]').href = imageDataURL;
    }

    if (size === 32) {
      document.querySelector('link[rel="icon"][sizes="32x32"]').href = imageDataURL;
    }

    if (shouldReuse) {
      const div = existingDivs[index];
      if (div) {
        const preview = div.querySelector('img');
        const link = div.querySelector('a');

        if (preview) preview.src = imageDataURL;
        if (link) {
          link.href = imageDataURL;
        }
      }
    } else {
      const preview = document.createElement('img');
      preview.src = imageDataURL;
      preview.width = size;
      preview.height = size;

      const link = document.createElement('a');
      link.classList.add('blue-button');
      link.download = `icon${size}.png`;
      link.href = imageDataURL;
      link.innerHTML = `Download ${size}x${size} px`;

      const div = document.createElement('div');
      div.appendChild(preview);
      div.appendChild(link);
      outputImages.appendChild(div);
    }

    zip.file(`icon${size}.png`, imageDataURL.split('base64,')[1], {
      base64: true,
    });
  });

  downloadAllButton.classList.remove('hidden');
  codeSnippet.classList.remove('hidden');
  downloadAllButton.disabled = false;
};

const getFileExtension = (mimeType) => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpeg';
    case 'image/png':
      return 'png';
    default:
      return 'png'; // Defaults to png
  }
};

const copyToClipboard = () => {
  const codeSnippet = document.getElementById('codeSnippet');
  const copyButton = document.getElementById('copy-button');
  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(codeSnippet);
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    document.execCommand('copy');
    copyButton.innerHTML = `Copied <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
  <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
  <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
</svg>
`;
  } catch (err) {
    copyButton.innerHTML = `Error <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
</svg>
`;
  }

  setTimeout(() => {
    copyButton.innerHTML = `Copy 
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
  <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
  <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
</svg>
`;
  }, 2000);

  selection.removeAllRanges();
};

const downloadAll = () => {
  zip.generateAsync({ type: 'blob' }).then(function (content) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'icons.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};
