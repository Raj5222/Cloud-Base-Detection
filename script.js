const form = document.getElementById('upload-form');
const resultContainer = document.getElementById('result');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData();

  // Get the selected image directly
  const image = document.getElementById('image').files[0];
  console.log('Wait For Response');

  // Ensure image is a valid Blob before appending to FormData
  if (image instanceof Blob) {
    formData.append('image', image, 'uploaded_image.jpeg');
    try {
      const response = await fetch('https://image-detection-olo3.onrender.com', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      console.log('Response:', data); // Log the API response data to the console

      document.getElementById("data-title").textContent = "Result"; // Print Value Of Labels
      var labelValues = document.getElementById("data");
      data.faces.concat(data.objects).forEach(function(item) {
        var listItem = document.createElement("li");
        if (item.label) {
          listItem.textContent = item.label;
          labelValues.appendChild(listItem);
        }
      });

      if (response.ok) {
        // Create an Image object to get the actual image dimensions
        const img = new Image();
        img.onload = function() {
          displayResult(data, img);
        };
        img.src = URL.createObjectURL(image);
      } else {
        displayError(data.error);
      }
    } catch (error) {
      displayError('An error occurred while processing the request.');
    }
  } else {
    displayError('Error uploading the image.');
  }
});

const cornerRadius = 5;

function displayResult(data, image) {
  // Clear previous results
  resultContainer.innerHTML = '';

  // Create an image element for the detected faces and objects
  const resultImageTag = image;

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  console.log("Width :- ", canvas.width, "\nHeight :- ", canvas.height);
  const ctx = canvas.getContext('2d');

  // Draw rounded rectangle
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(image.naturalWidth - cornerRadius, 0);
  ctx.quadraticCurveTo(image.naturalWidth, 0, image.naturalWidth, cornerRadius);
  ctx.lineTo(image.naturalWidth, image.naturalHeight - cornerRadius);
  ctx.quadraticCurveTo(image.naturalWidth, image.naturalHeight, image.naturalWidth - cornerRadius, image.naturalHeight);
  ctx.lineTo(cornerRadius, image.naturalHeight);
  ctx.quadraticCurveTo(0, image.naturalHeight, 0, image.naturalHeight - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.clip(); // Clip the context to the rounded rectangle path

  // Draw the image on the canvas with rounded corners
  ctx.drawImage(resultImageTag, 0, 0, image.naturalWidth, image.naturalHeight);
  ctx.lineWidth = 2;

  // Draw green bounding boxes for detected faces with labels
  ctx.strokeStyle = 'green';
  if (data.faces && Array.isArray(data.faces)) {
    data.faces.forEach((face, index) => {
      if (face.vertices && face.vertices.length === 4) {
        const vertices = face.vertices.map((vertex) => {
          return [
            vertex[0], // Convert normalized x-coordinate to pixel position
            vertex[1]// Convert normalized y-coordinate to pixel position
          ];
        });

        ctx.beginPath();
        ctx.moveTo(vertices[0][0], vertices[0][1]);
        ctx.lineTo(vertices[1][0], vertices[1][1]);
        ctx.lineTo(vertices[2][0], vertices[2][1]);
        ctx.lineTo(vertices[3][0], vertices[3][1]);
        ctx.closePath();
        ctx.stroke();

        // Draw label for the face
        const label = face.label;
        ctx.fillStyle = 'green';
        ctx.font = '16px Arial';
        ctx.fillText(label, vertices[0][0], vertices[0][1] + 20);
      }
    });
  }

  // Draw red bounding boxes for detected objects with labels (excluding "Person")
  ctx.strokeStyle = 'red';
  if (data.objects && Array.isArray(data.objects)) {
    data.objects.forEach((object, index) => {
      const vertices = object.vertices.map((vertex) => {
        return [
          vertex[0] * image.naturalWidth, // Convert normalized x-coordinate to pixel position
          vertex[1] * image.naturalHeight // Convert normalized y-coordinate to pixel position
        ];
      });
      ctx.beginPath();
      ctx.moveTo(vertices[0][0], vertices[0][1]);
      ctx.lineTo(vertices[1][0], vertices[1][1]);
      ctx.lineTo(vertices[2][0], vertices[2][1]);
      ctx.lineTo(vertices[3][0], vertices[3][1]);
      ctx.closePath();
      ctx.stroke();

      // Draw label for the object
      const label = object.label;
      ctx.fillStyle = 'red';
      ctx.font = '16px Arial';
      ctx.fillText(label, vertices[0][0], vertices[0][1] + 20);
    });
  }

  // Append the canvas to the resultContainer
  resultContainer.innerHTML = ''; // Clear previous content
  resultContainer.appendChild(canvas);
}

function displayError(errorMessage) {
  resultContainer.innerHTML = `<p>Error: ${errorMessage}</p>`;
}
