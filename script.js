const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const branchInput = document.getElementById('branch');
const courseInput = document.getElementById('course');
const usnInput = document.getElementById('usn');
const dobInput = document.getElementById('dob');
const batchInput = document.getElementById('batch');
const bloodGroupInput = document.getElementById('blood-group');
const addressInput = document.getElementById('address');
const sizes = document.getElementById('sizes');
const imageInput = document.getElementById('image');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrContainer = document.querySelector('.qr-body');

let size = sizes.value;

generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isEmptyInput();
});

sizes.addEventListener('change', (e) => {
    size = e.target.value;
    isEmptyInput();
});

downloadBtn.addEventListener('click', () => {
    let img = document.querySelector('.qr-body img');
    if (img !== null) {
        let imgAtrr = img.getAttribute('src');
        downloadBtn.setAttribute("href", imgAtrr);
    } else {
        downloadBtn.setAttribute("href", `${document.querySelector('canvas').toDataURL()}`);
    }
});

function isEmptyInput() {
    const name = nameInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;
    const branch = branchInput.value;
    const course = courseInput.value;
    const usn = usnInput.value;
    const dob = dobInput.value;
    const batch = batchInput.value;
    const bloodGroup = bloodGroupInput.value;
    const address = addressInput.value;

    if (name && email && phone && branch && course && usn && dob && batch && bloodGroup && address) {
        generateQRCode();
    } else {
        alert("Please fill out all fields to generate your QR code");
    }
}

function generateQRCode() {
    const name = nameInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;
    const branch = branchInput.value;
    const course = courseInput.value;
    const usn = usnInput.value;
    const dob = dobInput.value;
    const batch = batchInput.value;
    const bloodGroup = bloodGroupInput.value;
    const address = addressInput.value;
    
    const qrContent = `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Branch: ${branch}
        Course: ${course}
        USN: ${usn}
        DOB: ${dob}
        Batch: ${batch}
        Blood Group: ${bloodGroup}
        Address: ${address}
    `;

    if (imageInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgBase64 = event.target.result;
            generateQRCodeImage(qrContent, imgBase64, size);
            sendFormData(qrContent, imgBase64);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        generateQRCodeImage(qrContent, null, size);
        sendFormData(qrContent, null);
    }
}

function generateQRCodeImage(qrContent, imgBase64, size) {
    qrContainer.innerHTML = "";
    const qrOptions = {
        text: qrContent,
        height: size,
        width: size,
        colorLight: "#fff",
        colorDark: "#000",
    };

    if (imgBase64) {
        qrOptions.image = imgBase64;
        qrOptions.imageOptions = {
            hideBackgroundDots: true,
            margin: 2,
        };
    }

    new QRCode(qrContainer, qrOptions);
}

function sendFormData(qrContent, imgBase64) {
    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('email', emailInput.value);
    formData.append('phone', phoneInput.value);
    formData.append('branch', branchInput.value);
    formData.append('course', courseInput.value);
    formData.append('usn', usnInput.value);
    formData.append('dob', dobInput.value);
    formData.append('batch', batchInput.value);
    formData.append('bloodGroup', bloodGroupInput.value);
    formData.append('address', addressInput.value);
    formData.append('size', size);
    formData.append('qrContent', qrContent);
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    fetch('/generateQR', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Data saved successfully:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
