const form = document.getElementById('upload-form');
const resultContainer = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData();

  // Perform client-side image resizing before upload
  const uploadImage = document.getElementById('image').files[0];
  const resizedImage = await resizeImage(uploadImage, 0.25);

  // Ensure resizedImage is a valid Blob before appending to FormData
  if (resizedImage instanceof Blob) {
    formData.append('image', resizedImage, 'resized_image.jpeg');

    try {
      const response = await fetch('https://image-nes5.onrender.com/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      console.log('API Response:', data); // Log the API response data to the console

      if (response.ok) {
        displayResult(data, resizedImage);
      } else {
        displayError(data.error);
      }
    } catch (error) {
      displayError('An error occurred while processing the request.');
    }
  } else {
    displayError('Error resizing the image.');
  }
});

const image_width = 270;
const image_hight = 250;
const cornerRadius = 20;

function resizeImage(imageFile, scaleFactor) {
  return new Promise((resolve) => {
    const fileReader = new FileReader();

    fileReader.onload = function(event) {
      const image = new Image();

      image.onload = function() {
        const scaledWidth = image_width;
        const scaledHeight = image_hight;
        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, scaledWidth, scaledHeight);

        // Convert canvas content to Blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };

      image.src = event.target.result;
    };

    fileReader.readAsDataURL(imageFile);
  });
}

function displayResult(data, resizedImage) {
  // Clear previous results
  resultContainer.innerHTML = '';

  // Create an image element for the detected faces and objects
  const resultImageTag = document.createElement('img');


  resultImageTag.src = URL.createObjectURL(resizedImage);
  resultImageTag.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image_width;
    canvas.height = image_hight;
    const ctx = canvas.getContext('2d');

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(image_width - cornerRadius, 0);
    ctx.quadraticCurveTo(image_width, 0, image_width, cornerRadius);
    ctx.lineTo(image_width, image_hight - cornerRadius);
    ctx.quadraticCurveTo(image_width, image_hight, image_width - cornerRadius, image_hight);
    ctx.lineTo(cornerRadius, image_hight);
    ctx.quadraticCurveTo(0, image_hight, 0, image_hight - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.clip(); // Clip the context to the rounded rectangle path

    // Draw the image on the canvas with rounded corners
    ctx.drawImage(resultImageTag, 0, 0, image_width, image_hight);
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
        if (object.label !== 'Person' && object.vertices && object.vertices.length === 4) {
          const vertices = object.vertices.map((vertex) => {
            return [
              vertex[0] * image_width, // Convert normalized x-coordinate to pixel position
              vertex[1] * image_hight // Convert normalized y-coordinate to pixel position
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
        }
      });
    }

    // Append the canvas to the resultContainer
    resultContainer.innerHTML = ''; // Clear previous content
    resultContainer.appendChild(canvas);
  };
}
function displayError(errorMessage) {
  resultContainer.innerHTML = `<p>Error: ${errorMessage}</p>`;
}
