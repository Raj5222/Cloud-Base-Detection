const form = document.getElementById('upload-form');
const resultContainer = document.getElementById('result');
const progress = document.getElementById('progress');
const resultBtn = document.getElementById('result-btn');
const resultShowBtn = document.getElementById('result-show');
const formSteps = document.querySelectorAll(".form-step");
const progressSteps = document.querySelectorAll(".progress-step");

let formStepsNum = 0;

// Handle form submission and image upload
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData();
  const image = document.getElementById('image').files[0];

  if (image instanceof Blob) {
    formData.append('image', image, 'uploaded_image.jpeg');
    try {
      const response = await fetch('https://image-detection-olo3.onrender.com', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('API Response:', data);

      document.getElementById("data-title").textContent = "Detection Results";
      const labelValues = document.getElementById("data");

      // Append detected labels for faces and objects
      labelValues.innerHTML = '';
      data.faces.concat(data.objects).forEach(function (item) {
        if (item.label) {
          const listItem = document.createElement("li");
          listItem.textContent = item.label;
          labelValues.appendChild(listItem);
        }
      });

      if (response.ok) {
        const img = new Image();
        img.onload = function () {
          displayResult(data, img);
        };
        img.src = URL.createObjectURL(image);
      } else {
        displayError(data.error || "An error occurred.");
      }
    } catch (error) {
      displayError('Network error: ' + error.message);
    }
  } else {
    displayError('Error uploading the image.');
  }
});

// Display the detected result on the canvas
function displayResult(data, image) {
  resultContainer.innerHTML = ''; // Clear previous result
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);

  // Draw bounding boxes for detected faces and objects
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 3;

  data.faces.forEach(face => {
    ctx.strokeRect(face.x, face.y, face.width, face.height);
  });

  data.objects.forEach(obj => {
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
  });

  resultContainer.appendChild(canvas);
}

// Display error message
function displayError(message) {
  resultContainer.innerHTML = `<p class="error">${message}</p>`;
}

// Update form steps
function updateFormSteps() {
  formSteps.forEach((formStep) => {
    formStep.classList.remove("form-step-active");
  });
  formSteps[formStepsNum].classList.add("form-step-active");
}

// Update progress bar
function updateProgressbar() {
  progressSteps.forEach((progressStep, idx) => {
    progressStep.classList.toggle("progress-step-active", idx <= formStepsNum);
  });

  const progressActive = document.querySelectorAll(".progress-step-active");
  progress.style.width = ((progressActive.length - 1) / (progressSteps.length - 1)) * 100 + "%";
}

// Handle next and previous button clicks for form steps
document.querySelectorAll(".btn-next").forEach((btn) => {
  btn.addEventListener("click", () => {
    formStepsNum++;
    updateFormSteps();
    updateProgressbar();
  });
});

document.querySelectorAll(".btn-prev").forEach((btn) => {
  btn.addEventListener("click", () => {
    formStepsNum--;
    updateFormSteps();
    updateProgressbar();
  });
});

resultBtn.addEventListener('click', () => {
  document.getElementById('result-btn').style.display = 'block';
});

resultShowBtn.addEventListener('click', () => {
  formStepsNum--;
  updateFormSteps();
  updateProgressbar();
});
