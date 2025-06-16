document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const fileNameDisplay = document.getElementById('fileName');
    const generateCaptionBtn = document.getElementById('generateCaption');
    const imagePreview = document.getElementById('imagePreview');
    const loadingDiv = document.getElementById('loading');
    const captionResultDiv = document.getElementById('captionResult');
    const captionText = document.getElementById('captionText');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('errorText');

    let selectedFile = null;

    // Ensure all message divs are hidden on initial load
    hideAllMessages();

    imageUpload.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = selectedFile.name;
            generateCaptionBtn.disabled = false;
            hideAllMessages();

            // Display image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(selectedFile);

        } else {
            fileNameDisplay.textContent = 'No file chosen';
            generateCaptionBtn.disabled = true;
            imagePreview.src = '#';
            imagePreview.classList.add('hidden');
        }
    });

    generateCaptionBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showError('Please select an image first.');
            return;
        }

        hideAllMessages();
        loadingDiv.classList.remove('hidden');
        generateCaptionBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            captionText.textContent = data.caption;
            captionResultDiv.classList.remove('hidden');

        } catch (error) {
            showError(`Failed to generate caption: ${error.message}`);
        } finally {
            loadingDiv.classList.add('hidden');
            generateCaptionBtn.disabled = false;
        }
    });

    function hideAllMessages() {
        loadingDiv.classList.add('hidden');
        captionResultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
    }

    function showError(message) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    }
});