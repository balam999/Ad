const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapButton = document.getElementById('snap');
const recordButton = document.getElementById('record');
const stopButton = document.getElementById('stop');
const statusText = document.getElementById('status');

let mediaRecorder;
let recordedChunks = [];

// ক্যামেরা চালু করা
async function initCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user" // পেছনের ক্যামেরার জন্য "environment" ব্যবহার করতে পারেন
            },
            audio: true // ভিডিওর সাথে অডিও রেকর্ডের জন্য
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // ফোকাস ও স্টেবিলাইজেশন কন্ট্রোল (যদি ব্রাউজার বা হার্ডওয়্যার সাপোর্ট করে)
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
        }

        setupRecorder(stream);
    } catch (err) {
        console.error("ক্যামেরা চালু করতে সমস্যা হয়েছে: ", err);
        statusText.innerText = "ক্যামেরা এক্সেস পাওয়া যায়নি! দয়া করে পার্মিশন দিন।";
    }
}

initCamera();

// ১. ছবি তোলা এবং ফাইল ম্যানেজারে ডাউনলোড করা
snapButton.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ইমেজ ডাটা ইউআরএল তৈরি
    const dataURL = canvas.toDataURL('image/png');
    
    // ডাউনলোড লিংক তৈরি করে অটো ক্লিক করা (ফাইল ম্যানেজারে ডাউনলোড হবে)
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `photo_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    statusText.innerText = "ছবি সফলভাবে ডাউনলোড হয়েছে!";
});

// ২. ভিডিও রেকর্ডিং সেটআপ
function setupRecorder(stream) {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        recordedChunks = [];
        const url = URL.createObjectURL(blob);

        // ভিডিও ফাইল ম্যানেজারে ডাউনলোড করা
        const link = document.createElement('a');
        link.href = url;
        link.download = `video_${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusText.innerText = "ভিডিও সফলভাবে ডাউনলোড হয়েছে!";
    };
}

// ভিডিও রেকর্ডিং শুরু
recordButton.addEventListener('click', () => {
    recordedChunks = [];
    mediaRecorder.start();
    recordButton.disabled = true;
    stopButton.disabled = false;
    statusText.innerText = "রেকর্ডিং হচ্ছে...";
});

// ভিডিও রেকর্ডিং বন্ধ করা
stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    recordButton.disabled = false;
    stopButton.disabled = true;
});
