import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SignOut,
  ArrowsClockwise,
  ArrowCounterClockwise,
  UploadSimple,
  Trash,
  CheckCircle,
  ShieldCheck,
  Info,
  User,
  Lock,
  WarningCircle,
  CaretDown,
  Sun,
  Moon,
  Check,
  Camera,
  VideoCamera,
  Eraser,
  X,
  Crop,
  PencilSimpleLine,
  Plus,
  Minus
} from '@phosphor-icons/react';
import { studentApi } from '../../services/api';
import Footer from '../common/Footer';
import './StudentRegistrationView.css';

// ── Academic Organizations & Academic Programs ──────────────────────────────
// JPIA removed as requested. Exact names updated as specified:
// SMS: Samahan ng mga Mag-aaral ng Sikolohiya
// YES: Young Educators' Society
// HRSS: Human Resource Students Society
// IBITS: Institute of Bachelors in Information Technology Studies

const ORGANIZATIONS = [
  {
    code: 'ACES',
    name: 'Association of Computer Engineering Students',
    logo: '/img/orgs/aces.png',
    headerImg: '/img/orgs/aces_header.png',
    color: '#800000',
    courses: [
      { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
      { code: 'DCPET', name: 'Diploma in Computer Engineering Technology' }
    ]
  },
  {
    code: 'HRSS',
    name: 'Human Resource Students Society',
    logo: '/img/orgs/hrss.png',
    headerImg: '/img/orgs/hrss_header.png',
    color: '#c0392b',
    courses: [
      { code: 'BSBA-HRM', name: 'Bachelor of Science in Business Administration Major in Human Resource Management' }
    ]
  },
  {
    code: 'IBITS',
    name: 'Institute of Bachelors in Information Technology Studies',
    logo: '/img/orgs/ibits.png',
    headerImg: '/img/orgs/ibits_header.png',
    color: '#058EA3',
    courses: [
      { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
      { code: 'DIT', name: 'Diploma in Information Technology' }
    ]
  },
  {
    code: 'PIIE',
    name: 'Philippine Institute of Industrial Engineers',
    logo: '/img/orgs/piie.png',
    headerImg: '/img/orgs/piie_header.png',
    color: '#16AB68',
    courses: [
      { code: 'BSIE', name: 'Bachelor of Science in Industrial Engineering' }
    ]
  },
  {
    code: 'SMS',
    name: 'Samahan ng mga Mag-aaral ng Sikolohiya',
    logo: '/img/orgs/sms.png',
    headerImg: '/img/orgs/sms_header.png',
    color: '#4F0580',
    courses: [
      { code: 'BSPSY', name: 'Bachelor of Science in Psychology' }
    ]
  },
  {
    code: 'YES',
    name: "Young Educators' Society",
    logo: '/img/orgs/yes.png',
    headerImg: '/img/orgs/yes_header.png',
    color: '#090979',
    courses: [
      { code: 'BSED-ENG', name: 'Bachelor of Secondary Education Major in English' },
      { code: 'BSED-SS', name: 'Bachelor of Secondary Education Major in Social Studies' },
      { code: 'BEED', name: 'Bachelor of Elementary Education' }
    ]
  }
];

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const SECTIONS_BY_YEAR = {
  '1st Year': ['1-1', '1-2', '1-3'],
  '2nd Year': ['2-1', '2-2'],
  '3rd Year': ['3-1', '3-2'],
  '4th Year': ['4-1', '4-2']
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate years 2012 down to 1970 for convenient DOB selection
const YEAR_OPTIONS = Array.from({ length: 43 }, (_, i) => 2012 - i);

const STEPS = [
  { id: 1, label: 'Academic' },
  { id: 2, label: 'Personal' },
  { id: 3, label: 'Emergency' },
  { id: 4, label: 'Media' },
  { id: 5, label: 'Review' }
];

const FUNNY_CONTACT_NAMES = [
  'e.g. Mary G. Piattos',
  'e.g. Andy Lim',
  'e.g. Don T. Piang',
  'e.g. Jay T. Kamote',
  'e.g. Matthew N. Keso',
  'e.g. Nova B. Santos',
  'e.g. Gol D. Roger',
  'e.g. Patty T. Ting',
  'e.g. Mico A. Harina',
  'e.g. Walter H. White',
  'e.g. Alejandro Y. Pikit',
  'e.g. Beverly C. Pampano',
  'e.g. Tanya C. Markova'
];

export default function StudentRegistrationView({ onBack }) {
  // Theme state: light by default as requested
  const [theme, setTheme] = useState('light');
  const [currentStep, setCurrentStep] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState(null);
  const [stepError, setStepError] = useState('');
  const [isOrgOpen, setIsOrgOpen] = useState(false);

  // Modern Date of Birth parts
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');

  // Random funny placeholder for emergency contact person (fixed per student entry)
  const [funnyNameIndex, setFunnyNameIndex] = useState(() =>
    Math.floor(Math.random() * FUNNY_CONTACT_NAMES.length)
  );

  // ── Live Visitor Heartbeat for Accurate Dashboard Metrics ────────────────
  useEffect(() => {
    let sessionId = sessionStorage.getItem('synapse_visitor_session');
    if (!sessionId) {
      sessionId = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem('synapse_visitor_session', sessionId);
    }

    studentApi.heartbeat(sessionId);

    const interval = setInterval(() => {
      studentApi.heartbeat(sessionId);
    }, 15000);

    const handleLeave = () => {
      studentApi.heartbeatLeave(sessionId);
    };

    window.addEventListener('beforeunload', handleLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleLeave);
      studentApi.heartbeatLeave(sessionId);
    };
  }, []);

  const orgDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Camera Modal & Stream State ──────────────────────────────────────────
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [snappedPhoto, setSnappedPhoto] = useState(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // ── 1:1 Photo Cropper Modal State (1500 × 1500 px) ────────────────────────
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropRotation, setCropRotation] = useState(0);
  const cropDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // ── Dedicated Signature Modal State (2000 × 1200 px) ──────────────────────
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [sigBrushSize, setSigBrushSize] = useState(3.5);
  const modalSigCanvasRef = useRef(null);
  const modalStrokesRef = useRef([]);
  const modalCurrentStrokeRef = useRef(null);
  const isModalDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [modalStrokeCount, setModalStrokeCount] = useState(0);

  const [formData, setFormData] = useState({
    // Step 1: Academic
    org: '',
    course: '',
    yearLevel: '',
    section: '',

    // Step 2: Personal
    firstName: '',
    middleName: '',
    lastName: '',
    studentNumber: '',
    email: '',
    gender: '',
    birthDate: '', // YYYY-MM-DD
    residentialAddress: '',

    // Step 3: Emergency
    contactPersonName: '',
    contactPersonNumber: '',
    contactPersonAddress: '',
    sameAddress: false,

    // Step 4: Media
    photoUrl: null,
    photoFileName: '',
    signatureUrl: null,

    // Step 5: Certification
    certified: false
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setIsOrgOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOrg = useMemo(() => {
    return ORGANIZATIONS.find((o) => o.code === formData.org) || null;
  }, [formData.org]);

  // Fallback for color/theme accents before an organization is selected
  const themeOrg = selectedOrg || ORGANIZATIONS[0];

  const selectedCourse = useMemo(() => {
    if (!selectedOrg) return null;
    return selectedOrg.courses.find((c) => c.code === formData.course) || null;
  }, [selectedOrg, formData.course]);

  const availableSections = useMemo(() => {
    return formData.yearLevel ? (SECTIONS_BY_YEAR[formData.yearLevel] || []) : [];
  }, [formData.yearLevel]);

  // Calculate days in selected month and year
  const daysInMonth = useMemo(() => {
    if (!dobMonth) return 31;
    const m = parseInt(dobMonth, 10);
    const y = dobYear ? parseInt(dobYear, 10) : 2024;
    return new Date(y, m, 0).getDate();
  }, [dobMonth, dobYear]);

  // Handle text input changes — forces uppercase on text fields
  const handleChange = (field, value) => {
    const textFields = ['firstName', 'middleName', 'lastName', 'residentialAddress',
                        'contactPersonName', 'contactPersonAddress'];
    const finalValue = textFields.includes(field) ? value.toUpperCase() : value;
    setFormData((prev) => {
      const updated = { ...prev, [field]: finalValue };
      if (field === 'residentialAddress' && prev.sameAddress) {
        updated.contactPersonAddress = finalValue;
      }
      return updated;
    });
    if (stepError) setStepError('');
  };

  // QoL 1: Auto-insert dashes for student number mask: 0000-00000-BN-0
  const handleStudentNumberInput = (raw) => {
    // Strip all non-alphanumeric except existing dashes, then rebuild mask
    const digits = raw.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    let masked = '';
    let i = 0;
    // Part 1: 4 digits
    const part1 = digits.slice(0, 4);
    masked += part1;
    i += part1.length;
    if (i >= 4 && digits.length > 4) masked += '-';
    // Part 2: 5 digits
    const part2 = digits.slice(4, 9);
    masked += part2;
    if (digits.length > 9) masked += '-';
    // Part 3: 2 chars (BN)
    const part3 = digits.slice(9, 11);
    masked += part3;
    if (digits.length > 11) masked += '-';
    // Part 4: 1 char
    const part4 = digits.slice(11, 12);
    masked += part4;
    setFormData((prev) => ({ ...prev, studentNumber: masked }));
    if (stepError) setStepError('');
  };

  // QoL 4: Allow only digits for contact phone number
  const handleContactNumberInput = (raw) => {
    const digitsOnly = raw.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, contactPersonNumber: digitsOnly }));
    if (stepError) setStepError('');
  };

  // Modern DOB change handler
  const handleDobPartChange = (part, value) => {
    let m = dobMonth;
    let d = dobDay;
    let y = dobYear;

    if (part === 'month') {
      m = value;
      setDobMonth(value);
    } else if (part === 'day') {
      d = value;
      setDobDay(value);
    } else if (part === 'year') {
      y = value;
      setDobYear(value);
    }

    if (m && d && y) {
      const fullDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      handleChange('birthDate', fullDate);
    } else {
      handleChange('birthDate', '');
    }
  };

  // Select organization
  const handleSelectOrg = (orgCode) => {
    setFormData((prev) => ({
      ...prev,
      org: orgCode,
      course: ''
    }));
    if (stepError) setStepError('');
  };

  // Change Year Level
  const handleYearLevelChange = (year) => {
    setFormData((prev) => ({
      ...prev,
      yearLevel: year,
      section: ''
    }));
    if (stepError) setStepError('');
  };

  // "Same as Residential" address toggle
  const handleSameAddressToggle = () => {
    const nextState = !formData.sameAddress;
    setFormData((prev) => ({
      ...prev,
      sameAddress: nextState,
      contactPersonAddress: nextState ? prev.residentialAddress : ''
    }));
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStepError('Photo file size exceeds 5 MB limit. Please select a smaller image.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStepError('Invalid file type. Please upload a valid JPG or PNG image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setFormData((prev) => ({
        ...prev,
        photoUrl: dataUrl,
        photoFileName: file.name
      }));
      setStepError('');
      // Open 1:1 cropper for 1500 × 1500 px standard
      openCropperModal(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: null,
      photoFileName: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Dynamic Org-Themed Navbar Style ──────────────────────────────────────
  const navDynamicStyle = useMemo(() => {
    if (theme === 'dark') {
      // Dark mode: sleek blend of black with a subtle tint and border of the org color
      return {
        background: `linear-gradient(135deg, color-mix(in srgb, ${themeOrg.color} 26%, #08080B) 0%, #0d0d12 60%, color-mix(in srgb, ${themeOrg.color} 14%, #040406) 100%)`,
        borderBottom: `1px solid color-mix(in srgb, ${themeOrg.color} 45%, rgba(255,255,255,0.08))`,
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.4)'
      };
    } else {
      // Light mode: full vibrant organization branding
      return {
        background: `linear-gradient(135deg, ${themeOrg.color} 0%, color-mix(in srgb, ${themeOrg.color} 80%, #000000) 100%)`,
        borderBottom: '1px solid rgba(0, 0, 0, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      };
    }
  }, [theme, themeOrg.color]);

  // ── Dynamic Main Page Background Style & Org Theming Variables ──────────
  const pageBgStyle = useMemo(() => {
    const focusRing = `color-mix(in srgb, ${themeOrg.color} 24%, transparent)`;
    if (theme === 'dark') {
      // Dark Mode: Deep dark canvas with an ambient radial tint of the active org color
      return {
        background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${themeOrg.color} 24%, #040406) 0%, #08080C 55%, #020204 100%)`,
        transition: 'background 0.4s ease',
        '--sreg-org-color': themeOrg.color,
        '--sreg-input-focus-border': themeOrg.color,
        '--sreg-input-focus-ring': focusRing
      };
    } else {
      // Light Mode: Clean legacy neutral canvas infused with subtle org tone
      return {
        background: `linear-gradient(125deg, color-mix(in srgb, ${themeOrg.color} 6%, #DDE0E5) 0%, #F5F4F2 35%, color-mix(in srgb, ${themeOrg.color} 7%, #EAE7E4) 75%, color-mix(in srgb, ${themeOrg.color} 5%, #D7DAE0) 100%)`,
        transition: 'background 0.4s ease',
        '--sreg-org-color': themeOrg.color,
        '--sreg-input-focus-border': themeOrg.color,
        '--sreg-input-focus-ring': focusRing
      };
    }
  }, [theme, themeOrg.color]);

  // ── Camera Modal & Stream Handlers ───────────────────────────────────────
  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startCameraStream = async (deviceId) => {
    setCameraError('');
    stopCameraStream();
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera stream error:', err);
      setCameraError(
        'Unable to access camera. Please check permissions or select an alternate device.'
      );
    }
  };

  const openCameraModal = async () => {
    setIsCameraOpen(true);
    setSnappedPhoto(null);
    setCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Please use the file upload option.');
      return;
    }

    try {
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = initialStream;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const vInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(vInputs);

      // Auto-detect Iriun Webcam
      const iriunDev = vInputs.find((d) => /iriun/i.test(d.label));
      const targetId = iriunDev ? iriunDev.deviceId : vInputs[0]?.deviceId || '';
      setSelectedDeviceId(targetId);

      if (targetId && iriunDev) {
        initialStream.getTracks().forEach((t) => t.stop());
        await startCameraStream(targetId);
      } else {
        if (videoRef.current) {
          videoRef.current.srcObject = initialStream;
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera access was blocked or is unavailable. Please check browser permissions.');
    }
  };

  const handleSwitchDevice = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    setSnappedPhoto(null);
    await startCameraStream(deviceId);
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setSnappedPhoto(null);
    setIsCameraOpen(false);
  };

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    // Capture full resolution from feed
    const offCanvas = document.createElement('canvas');
    offCanvas.width = video.videoWidth;
    offCanvas.height = video.videoHeight;
    const ctx = offCanvas.getContext('2d');
    // Mirror horizontally to match preview
    ctx.translate(offCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

    const fullDataUrl = offCanvas.toDataURL('image/jpeg', 0.95);
    setSnappedPhoto(fullDataUrl);
  };

  const retakePhoto = () => {
    setSnappedPhoto(null);
  };

  const confirmPhoto = () => {
    if (!snappedPhoto) return;
    const photoToCrop = snappedPhoto;
    closeCameraModal();
    setFormData((prev) => ({
      ...prev,
      photoFileName: 'camera_photo.jpg'
    }));
    // Open 1:1 cropper for 1500 x 1500 px standard framing
    openCropperModal(photoToCrop);
  };

  // ── 1:1 Photo Cropper Modal Handlers (1500 × 1500 px) ─────────────────────
  const openCropperModal = (imgSrc) => {
    setCropImageSrc(imgSrc || formData.photoUrl);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropRotation(0);
    setIsCropperOpen(true);
  };

  const closeCropperModal = () => {
    setIsCropperOpen(false);
  };

  const handleCropPointerDown = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    cropDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: cropOffset.x,
      initialY: cropOffset.y
    };
  };

  const handleCropPointerMove = (e) => {
    if (!cropDragRef.current.isDragging) return;
    const dx = e.clientX - cropDragRef.current.startX;
    const dy = e.clientY - cropDragRef.current.startY;
    setCropOffset({
      x: cropDragRef.current.initialX + dx,
      y: cropDragRef.current.initialY + dy
    });
  };

  const handleCropPointerUp = (e) => {
    cropDragRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleApplyCrop = () => {
    if (!cropImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Export to exact 1500 x 1500 px ID standard
      const outCanvas = document.createElement('canvas');
      outCanvas.width = 1500;
      outCanvas.height = 1500;
      const ctx = outCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clean white background (for edge padding if rotated)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1500, 1500);

      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      // Cover 1500 × 1500 px canvas (object-fit: cover - fills entire square with no empty space)
      const baseScale = Math.max(1500 / natW, 1500 / natH);
      const drawW = natW * baseScale;
      const drawH = natH * baseScale;

      // Scale factor from preview frame (320px viewport) to export (1500px)
      const scaleToExport = 1500 / 320;

      ctx.save();
      // Center transform at 750, 750
      ctx.translate(750, 750);
      ctx.translate(cropOffset.x * scaleToExport, cropOffset.y * scaleToExport);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedResult = outCanvas.toDataURL('image/jpeg', 0.95);
      setFormData((prev) => ({
        ...prev,
        photoUrl: croppedResult,
        photoFileName: prev.photoFileName || 'id_photo_1500x1500.jpg'
      }));
      setIsCropperOpen(false);
      setStepError('');
    };
    img.src = cropImageSrc;
  };

  // ── Dedicated Signature Modal Handlers (2000 × 1200 px) ───────────────────
  const openSignatureModal = () => {
    setIsSigModalOpen(true);
  };

  const closeSignatureModal = () => {
    setIsSigModalOpen(false);
  };

  const redrawModalCanvas = (allStrokes, canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of allStrokes) {
      if (!stroke || !stroke.points || stroke.points.length === 0) continue;
      ctx.lineWidth = stroke.size || 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0F172A';

      const pts = stroke.points;
      ctx.beginPath();
      if (pts.length === 1) {
        ctx.arc(pts[0].x, pts[0].y, (stroke.size || 12) / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
      } else {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    if (isSigModalOpen && modalSigCanvasRef.current) {
      const canvas = modalSigCanvasRef.current;
      canvas.width = 2000;
      canvas.height = 1200;
      redrawModalCanvas(modalStrokesRef.current, canvas);
    }
  }, [isSigModalOpen]);

  const getModalPointerPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handleModalSigPointerDown = (e) => {
    const canvas = modalSigCanvasRef.current;
    if (!canvas) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isModalDrawingRef.current = true;
    const pt = getModalPointerPos(e, canvas);
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / (rect.width || 600);
    modalCurrentStrokeRef.current = { points: [pt], size: (sigBrushSize || 3.5) * scaleFactor };
    const all = [...modalStrokesRef.current, modalCurrentStrokeRef.current];
    redrawModalCanvas(all, canvas);
  };

  const handleModalSigPointerMove = (e) => {
    if (!isModalDrawingRef.current || !modalCurrentStrokeRef.current) return;
    const canvas = modalSigCanvasRef.current;
    if (!canvas) return;
    const pt = getModalPointerPos(e, canvas);
    modalCurrentStrokeRef.current.points.push(pt);
    const all = [...modalStrokesRef.current, modalCurrentStrokeRef.current];
    redrawModalCanvas(all, canvas);
  };

  const handleModalSigPointerUp = (e) => {
    if (!isModalDrawingRef.current) return;
    isModalDrawingRef.current = false;
    const canvas = modalSigCanvasRef.current;
    if (!canvas) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (modalCurrentStrokeRef.current && modalCurrentStrokeRef.current.points.length > 0) {
      modalStrokesRef.current.push({
        points: [...modalCurrentStrokeRef.current.points],
        size: modalCurrentStrokeRef.current.size
      });
      modalCurrentStrokeRef.current = null;
      setModalStrokeCount(modalStrokesRef.current.length);
    }
  };

  const handleModalUndo = () => {
    if (modalStrokesRef.current.length === 0) return;
    modalStrokesRef.current.pop();
    setModalStrokeCount(modalStrokesRef.current.length);
    const canvas = modalSigCanvasRef.current;
    redrawModalCanvas(modalStrokesRef.current, canvas);
  };

  const handleModalClear = () => {
    modalStrokesRef.current = [];
    modalCurrentStrokeRef.current = null;
    setModalStrokeCount(0);
    const canvas = modalSigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSaveModalSignature = () => {
    if (modalStrokesRef.current.length === 0) {
      setStepError('Please sign on the canvas before saving.');
      return;
    }
    const canvas = modalSigCanvasRef.current;
    if (!canvas) return;

    // Export to exact 2000 x 1200 px standard on pure white background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 2000;
    exportCanvas.height = 1200;
    const ctx = exportCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 2000, 1200);
    ctx.drawImage(canvas, 0, 0);

    const sigDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
    handleChange('signatureUrl', sigDataUrl);
    setHasSignature(true);
    setIsSigModalOpen(false);
    setStepError('');
  };

  const handleClearSignature = () => {
    modalStrokesRef.current = [];
    modalCurrentStrokeRef.current = null;
    setModalStrokeCount(0);
    handleChange('signatureUrl', null);
    setHasSignature(false);
  };

  // Validate step before advancing
  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.org || !formData.course || !formData.yearLevel || !formData.section) {
        return 'Please complete all academic choices before proceeding.';
      }
    } else if (step === 2) {
      if (!formData.firstName.trim()) return 'First name is required.';
      if (!formData.lastName.trim()) return 'Last name is required.';
      if (!formData.studentNumber.trim()) return 'Student number is required.';
      if (!formData.email.trim()) return 'Email address is required.';
      // Valid email address format (accepts all providers: Gmail, Yahoo, Outlook, PUP webmail, etc.)
      if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/i.test(formData.email.trim())) {
        return 'Please enter a valid email address (e.g. name@example.com).';
      }
      if (!formData.gender) return 'Gender is required.';
      if (!formData.birthDate) return 'Complete date of birth (Month, Day, Year) is required.';
      if (!formData.residentialAddress.trim()) return 'Residential address is required.';
    } else if (step === 3) {
      if (!formData.contactPersonName.trim()) return 'Emergency contact person name is required.';
      if (!formData.contactPersonNumber.trim()) return 'Emergency contact phone number is required.';
      if (!formData.contactPersonAddress.trim()) return 'Emergency contact address is required.';
    } else if (step === 4) {
      if (!formData.photoUrl) return 'Student ID photo is required. Please capture or upload a photo.';
      if (!formData.signatureUrl) return 'Digital signature is required. Please record your signature.';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError('');
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setStepError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.certified) {
      setStepError('You must check the certification box to submit your registration.');
      return;
    }
    setIsSubmitting(true);
    setStepError('');
    try {
      const res = await studentApi.register(formData);
      setSubmissionResponse(res);
      setIsSubmitted(true);
    } catch (err) {
      setStepError(err.message || 'Registration submission failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    handleClearSignature();
    closeCameraModal();
    closeCropperModal();
    closeSignatureModal();
    setFormData({
      org: '',
      course: '',
      yearLevel: '',
      section: '',
      firstName: '',
      middleName: '',
      lastName: '',
      studentNumber: '',
      email: '',
      gender: '',
      birthDate: '',
      residentialAddress: '',
      contactPersonName: '',
      contactPersonNumber: '',
      contactPersonAddress: '',
      sameAddress: false,
      photoUrl: null,
      photoFileName: '',
      signatureUrl: null,
      certified: false
    });
    setDobMonth('');
    setDobDay('');
    setDobYear('');
    setCurrentStep(1);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmissionResponse(null);
    setStepError('');
    // Refresh to a new random funny placeholder for the next entry
    setFunnyNameIndex((prev) => {
      let next;
      do {
        next = Math.floor(Math.random() * FUNNY_CONTACT_NAMES.length);
      } while (next === prev && FUNNY_CONTACT_NAMES.length > 1);
      return next;
    });
  };

  // ── ID Card Live Preview Formatters (1:1 with Legacy System) ───────────────
  const previewFirst = formData.firstName
    ? `${formData.firstName.toUpperCase()} ${formData.middleName ? formData.middleName.charAt(0).toUpperCase() + '.' : ''}`
    : 'FIRST NAME M.';

  const previewLast = formData.lastName
    ? formData.lastName.toUpperCase()
    : 'LAST NAME';

  const previewFullName = `${previewFirst} ${previewLast}`;

  const previewStudentNum = formData.studentNumber
    ? formData.studentNumber.toUpperCase()
    : '202X-XXXXX-BN-X';

  const previewCourseFullName = selectedCourse?.name || 'DEGREE PROGRAM';

  // Format DOB as MM/DD/YYYY for legacy card back
  const previewFormattedDob = useMemo(() => {
    if (!formData.birthDate) return 'MM/DD/YYYY';
    const parts = formData.birthDate.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return 'MM/DD/YYYY';
  }, [formData.birthDate]);

  const previewResidentialAddress = formData.residentialAddress
    ? formData.residentialAddress.toUpperCase()
    : '123 STREET, BRGY, CITY, PROVINCE';

  const previewEmergencyContact = formData.contactPersonName
    ? `${formData.contactPersonName.toUpperCase()} - ${formData.contactPersonNumber || '09123456789'}`
    : 'CONTACT PERSON - 09123456789';

  const previewEmergencyAddress = (formData.sameAddress ? formData.residentialAddress : formData.contactPersonAddress)
    ? (formData.sameAddress ? formData.residentialAddress : formData.contactPersonAddress).toUpperCase()
    : 'CONTACT PERSON ADDRESS HERE';

  return (
    <div
      className={`sreg-page ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
      style={pageBgStyle}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sreg-navbar" style={navDynamicStyle}>
        <img
          src="/img/logo/aces_synapse_text_register.png"
          alt="ACES Synapse"
          className="sreg-navbar-banner"
        />

        <div className="sreg-navbar-actions">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            className="sreg-theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Simple Exit Button as requested */}
          <button className="sreg-navbar-exit" onClick={onBack} title="Exit Registration">
            <SignOut size={16} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* ── Main Body ─────────────────────────────────────────────────────── */}
      <div className="sreg-body">
        {/* ── Form Card (Left Column) ─────────────────────────────────────── */}
        <main className="sreg-form-card">
          {/* Org-Themed Header Banner with Dynamic Org Background */}
          <div
            className="sreg-card-header"
            style={{
              backgroundImage: (selectedOrg?.headerImg || ORGANIZATIONS[0].headerImg) ? `url('${selectedOrg?.headerImg || ORGANIZATIONS[0].headerImg}')` : undefined,
              backgroundColor: themeOrg.color
            }}
          >
            <img src={themeOrg.logo} alt={themeOrg.code} className="sreg-card-header-logo" />
            <div className="sreg-card-header-text">
              {selectedOrg ? `Registration Form — ${selectedOrg.code}` : 'Registration Form — ACES'}
            </div>
          </div>

          <div className="sreg-card-body">
            {/* ── Step Progress Indicator (SOLID OPAQUE DOTS, NO TRANSPARENCY) */}
                <div className="sreg-step-track">
                  <div className="sreg-step-track-line" />
                  <div
                    className="sreg-step-track-progress"
                    style={{
                      width: `calc((100% - 50px) * ${(currentStep - 1) / (STEPS.length - 1)})`,
                      backgroundColor: themeOrg.color
                    }}
                  />
                  <div className="sreg-step-dots">
                    {STEPS.map((s) => {
                      const isActive = s.id === currentStep;
                      const isCompleted = s.id < currentStep;
                      const dotColor = (isActive || isCompleted) ? themeOrg.color : undefined;
                      return (
                        <div key={s.id} className="sreg-step-dot-wrap">
                          <div
                            className={`sreg-step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            style={{
                              backgroundColor: dotColor,
                              borderColor: dotColor
                            }}
                          >
                            {isCompleted ? '✓' : s.id}
                          </div>
                          <span className={`sreg-step-label ${isActive ? 'active' : ''}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Validation Error Banner */}
                {stepError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#DC2626',
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: '0.84rem',
                      marginBottom: 16
                    }}
                  >
                    <WarningCircle size={18} color="#DC2626" weight="fill" />
                    <span>{stepError}</span>
                  </div>
                )}

                {/* ── Step 1: Academic Information ────────────────────────── */}
                {currentStep === 1 && (
                  <div>
                    <h3 className="sreg-step-title">Step 1: Academic Information</h3>

                    {/* Custom Organization Dropdown (ZERO WHITE FLASH) */}
                    <div className="sreg-field" style={{ marginBottom: 16 }}>
                      <label>
                        Organization <span className="req">*</span>
                      </label>
                      <div className="sreg-custom-dropdown" ref={orgDropdownRef}>
                        <button
                          type="button"
                          className="sreg-custom-dropdown-btn"
                          onClick={() => setIsOrgOpen((prev) => !prev)}
                        >
                          {selectedOrg ? (
                            <>
                              <img src={selectedOrg.logo} alt={selectedOrg.code} className="sreg-org-logo" />
                              <span className="sreg-org-btn-code">{selectedOrg.code}</span>
                              <span className="sreg-org-btn-name">— {selectedOrg.name}</span>
                            </>
                          ) : (
                            <span className="sreg-org-btn-placeholder">
                              Select Organization
                            </span>
                          )}
                          <CaretDown size={14} className={`sreg-dropdown-caret ${isOrgOpen ? 'open' : ''}`} />
                        </button>

                        {isOrgOpen && (
                          <ul className="sreg-custom-dropdown-menu">
                            {ORGANIZATIONS.map((org) => (
                              <li
                                key={org.code}
                                className={`sreg-custom-dropdown-item ${formData.org === org.code ? 'selected' : ''}`}
                                onClick={() => {
                                  handleSelectOrg(org.code);
                                  setIsOrgOpen(false);
                                }}
                              >
                                <img src={org.logo} alt={org.code} className="sreg-org-logo" />
                                <div className="sreg-org-item-text">
                                  <strong>{org.code}</strong>
                                  <span>{org.name}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Degree Program — FULL PROGRAM NAME ONLY (NO PROGRAM CODE) */}
                    <div className="sreg-field-group cols-1">
                      <div className="sreg-field">
                        <label htmlFor="course">
                          Course / Degree Program <span className="req">*</span>
                        </label>
                        <select
                          id="course"
                          value={formData.course}
                          onChange={(e) => handleChange('course', e.target.value)}
                          disabled={!selectedOrg}
                        >
                          <option value="">
                            {selectedOrg ? 'Select Course / Degree Program' : 'Select an organization first'}
                          </option>
                          {selectedOrg?.courses.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sreg-field-group cols-2">
                      <div className="sreg-field">
                        <label htmlFor="yearLevel">
                          Year Level <span className="req">*</span>
                        </label>
                        <select
                          id="yearLevel"
                          value={formData.yearLevel}
                          onChange={(e) => handleYearLevelChange(e.target.value)}
                        >
                          <option value="">Select Year Level</option>
                          {YEAR_LEVELS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sreg-field">
                        <label htmlFor="section">
                          Section <span className="req">*</span>
                        </label>
                        <select
                          id="section"
                          value={formData.section}
                          onChange={(e) => handleChange('section', e.target.value)}
                          disabled={!formData.yearLevel}
                        >
                          <option value="">
                            {formData.yearLevel ? 'Select Section' : 'Select a year level first'}
                          </option>
                          {availableSections.map((sec) => (
                            <option key={sec} value={sec}>
                              {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Personal Details ────────────────────────────── */}
                {currentStep === 2 && (
                  <div>
                    <h3 className="sreg-step-title">Step 2: Personal Details</h3>

                    <div className="sreg-field-group cols-3">
                      <div className="sreg-field">
                        <label htmlFor="firstName">
                          First Name <span className="req">*</span>
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          placeholder="e.g. Juan"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                        />
                      </div>

                      <div className="sreg-field">
                        <label htmlFor="middleName">Middle Name</label>
                        <input
                          id="middleName"
                          type="text"
                          placeholder="e.g. Dela Cruz"
                          value={formData.middleName}
                          onChange={(e) => handleChange('middleName', e.target.value)}
                        />
                      </div>

                      <div className="sreg-field">
                        <label htmlFor="lastName">
                          Last Name <span className="req">*</span>
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          placeholder="e.g. Santos"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="sreg-field-group cols-2">
                      <div className="sreg-field">
                        <label htmlFor="studentNumber">
                          Student Number <span className="req">*</span>
                        </label>
                        <input
                          id="studentNumber"
                          type="text"
                          placeholder="20XX-XXXXX-BN-0"
                          value={formData.studentNumber}
                          onChange={(e) => handleStudentNumberInput(e.target.value)}
                          maxLength={15}
                        />
                      </div>

                      <div className="sreg-field">
                        <label htmlFor="email">
                          Email Address <span className="req">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="sreg-field-group cols-1-2">
                      <div className="sreg-field">
                        <label htmlFor="gender">
                          Gender <span className="req">*</span>
                        </label>
                        <select
                          id="gender"
                          value={formData.gender}
                          onChange={(e) => handleChange('gender', e.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      {/* Modern, Convenient Date of Birth (Month, Day, Year) */}
                      <div className="sreg-field">
                        <label>
                          Date of Birth <span className="req">*</span>
                        </label>
                        <div className="sreg-dob-grid">
                          <select
                            value={dobMonth}
                            onChange={(e) => handleDobPartChange('month', e.target.value)}
                            aria-label="Birth Month"
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m, idx) => (
                              <option key={m} value={String(idx + 1).padStart(2, '0')}>
                                {m}
                              </option>
                            ))}
                          </select>

                          <select
                            value={dobDay}
                            onChange={(e) => handleDobPartChange('day', e.target.value)}
                            aria-label="Birth Day"
                          >
                            <option value="">Day</option>
                            {Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          <select
                            value={dobYear}
                            onChange={(e) => handleDobPartChange('year', e.target.value)}
                            aria-label="Birth Year"
                          >
                            <option value="">Year</option>
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={String(y)}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="sreg-field-group cols-1">
                      <div className="sreg-field">
                        <label htmlFor="residentialAddress">
                          Permanent Residential Address <span className="req">*</span>
                        </label>
                        <textarea
                          id="residentialAddress"
                          placeholder="House / Unit / Blk No., Street Name, Barangay, City / Municipality, Province"
                          value={formData.residentialAddress}
                          onChange={(e) => handleChange('residentialAddress', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Emergency Contact ──────────────────────────── */}
                {currentStep === 3 && (
                  <div>
                    <h3 className="sreg-step-title">Step 3: Emergency Contact Details</h3>

                    <div className="sreg-field-group cols-2">
                      <div className="sreg-field">
                        <label htmlFor="contactPersonName">
                          Contact Person Full Name <span className="req">*</span>
                        </label>
                        <input
                          id="contactPersonName"
                          type="text"
                          placeholder={FUNNY_CONTACT_NAMES[funnyNameIndex]}
                          value={formData.contactPersonName}
                          onChange={(e) => handleChange('contactPersonName', e.target.value)}
                        />
                      </div>

                      <div className="sreg-field">
                        <label htmlFor="contactPersonNumber">
                          Contact Person's Phone Number <span className="req">*</span>
                        </label>
                        <input
                          id="contactPersonNumber"
                          type="tel"
                          placeholder="e.g. 09171234567"
                          value={formData.contactPersonNumber}
                          onChange={(e) => handleContactNumberInput(e.target.value)}
                          maxLength={11}
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className="sreg-field-group cols-1">
                      <div className="sreg-field">
                        <label htmlFor="contactPersonAddress">
                          Contact Person Address <span className="req">*</span>
                        </label>
                        <input
                          id="contactPersonAddress"
                          type="text"
                          placeholder="House No., Street, Brgy, City, Province"
                          value={formData.contactPersonAddress}
                          onChange={(e) => handleChange('contactPersonAddress', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="sreg-field-checkbox-inline">
                      <label className="sreg-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.sameAddress}
                          onChange={handleSameAddressToggle}
                        />
                        <span>Same as student's permanent address</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Photo & Signature ──────────────────────────── */}
                {currentStep === 4 && (
                  <div>
                    <h3 className="sreg-step-title">Step 4: ID Photo & Signature Requirements</h3>

                    {/* General Officer Assistance Guideline Notice (No Iriun mention) */}
                    <div className="sreg-officer-banner">
                      <div className="sreg-officer-banner-icon" style={{ color: themeOrg.color }}>
                        <ShieldCheck size={22} weight="bold" />
                      </div>
                      <div className="sreg-officer-banner-text">
                        <strong>Officer Assistance Required</strong>
                        <span>
                          Please have an assigned registration officer assist you during this step to capture your ID photo via camera and verify your digital signature.
                        </span>
                      </div>
                    </div>

                    <div className="sreg-media-row">
                      {/* Left: Student ID Photo (Compact, Sleek Layout) */}
                      <div className="sreg-media-card">
                        <div className="sreg-media-card-header">
                          <div className="sreg-media-card-title-wrap">
                            <Camera size={18} weight="bold" style={{ color: themeOrg.color }} />
                            <span className="sreg-media-card-title">
                              Student ID Photo <span className="req">*</span>
                            </span>
                          </div>
                        </div>

                        <div className="sreg-media-card-body">
                          <div className="sreg-photo-compact-frame">
                            {formData.photoUrl ? (
                              <img
                                src={formData.photoUrl}
                                alt="Student ID Photo"
                                className="sreg-photo-compact-img"
                              />
                            ) : (
                              <div className="sreg-photo-compact-empty">
                                <User size={38} />
                                <span>No photo captured yet</span>
                              </div>
                            )}
                          </div>

                          <div className="sreg-compact-actions-wrap">
                            <button
                              type="button"
                              className="sreg-compact-btn-primary"
                              onClick={openCameraModal}
                              style={{ backgroundColor: themeOrg.color }}
                              title="Open live camera"
                            >
                              <Camera size={15} weight="bold" />
                              <span>{formData.photoUrl ? 'Retake' : 'Capture via Camera'}</span>
                            </button>

                            {formData.photoUrl && (
                              <>
                                <button
                                  type="button"
                                  className="sreg-compact-btn-secondary"
                                  onClick={() => openCropperModal(formData.photoUrl)}
                                  title="Crop to 1:1 square (1500 × 1500)"
                                >
                                  <Crop size={15} />
                                  <span>Crop</span>
                                </button>
                                <button
                                  type="button"
                                  className="sreg-compact-btn-danger"
                                  onClick={handleRemovePhoto}
                                  title="Remove photo"
                                >
                                  <Trash size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="sreg-media-card-footer">
                          JPG format · 1500 × 1500 px · High-resolution portrait
                        </div>
                      </div>

                      {/* Right: Digital Signature (Compact, Opens to Full Modal) */}
                      <div className="sreg-media-card">
                        <div className="sreg-media-card-header">
                          <div className="sreg-media-card-title-wrap">
                            <PencilSimpleLine size={18} weight="bold" style={{ color: themeOrg.color }} />
                            <span className="sreg-media-card-title">
                              Digital Signature <span className="req">*</span>
                            </span>
                          </div>
                        </div>

                        <div className="sreg-media-card-body">
                          <div className="sreg-sig-compact-frame">
                            {formData.signatureUrl ? (
                              <div className="sreg-sig-compact-preview">
                                <img
                                  src={formData.signatureUrl}
                                  alt="Recorded Signature"
                                  className="sreg-sig-compact-img"
                                />
                                <div className="sreg-sig-compact-line" />
                                <span className="sreg-sig-compact-name">{previewFullName}</span>
                              </div>
                            ) : (
                              <div className="sreg-sig-compact-empty">
                                <PencilSimpleLine size={38} />
                                <span>No digital signature recorded yet</span>
                              </div>
                            )}
                          </div>

                          <div className="sreg-compact-actions-wrap">
                            <button
                              type="button"
                              className="sreg-compact-btn-primary"
                              onClick={openSignatureModal}
                              style={{ backgroundColor: themeOrg.color }}
                              title="Open dedicated digital signature pad"
                            >
                              <PencilSimpleLine size={15} weight="bold" />
                              <span>{formData.signatureUrl ? 'Edit Signature' : 'Open Signature Pad'}</span>
                            </button>

                            {formData.signatureUrl && (
                              <button
                                type="button"
                                className="sreg-compact-btn-danger"
                                onClick={handleClearSignature}
                                title="Clear signature"
                              >
                                <Trash size={15} />
                                <span>Clear</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="sreg-media-card-footer">
                          Digital drawing · 2000 × 1200 px · Pure white background
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Review & Submit (Legacy 1:1 Match) ───────────── */}
                {currentStep === 5 && (
                  <div>
                    <h3 className="sreg-step-title" style={{ color: themeOrg.color }}>
                      Review Registration
                    </h3>

                    <p className="sreg-review-intro">
                      Please review the details below and the Live ID Preview <strong>(Flip to check the back)</strong>.
                      <br />
                      Once verified, <strong>check the certification box</strong> to enable the Submit button.
                    </p>

                    <table className="sreg-review-table legacy-style">
                      <tbody>
                        <tr>
                          <th>Name</th>
                          <td>{previewFullName}</td>
                        </tr>
                        <tr>
                          <th>Student Number</th>
                          <td>{formData.studentNumber || '-'}</td>
                        </tr>
                        <tr>
                          <th>Course</th>
                          <td>{selectedCourse?.name || '-'}</td>
                        </tr>
                        <tr>
                          <th>Year Level</th>
                          <td>{formData.yearLevel}</td>
                        </tr>
                        <tr>
                          <th>Birthdate</th>
                          <td>{formData.birthDate || '-'}</td>
                        </tr>
                        <tr>
                          <th>Address</th>
                          <td>{formData.residentialAddress || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Certification Box */}
                    <div
                      className={`sreg-cert-box ${formData.certified ? 'checked' : ''}`}
                      onClick={() => handleChange('certified', !formData.certified)}
                    >
                      <div className="sreg-cert-checkbox">
                        {formData.certified && <Check size={14} weight="bold" />}
                      </div>
                      <label className="sreg-cert-label">
                        I certify that the information provided is true and correct.
                      </label>
                    </div>
                  </div>
                )}

                {/* ── Wizard Navigation Buttons ───────────────────────────── */}
                <div className="sreg-nav-buttons">
                  <button
                    type="button"
                    className="sreg-btn-prev"
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </button>

                  {currentStep < 5 ? (
                    <button
                      type="button"
                      className="sreg-btn-next"
                      onClick={handleNext}
                      style={{ backgroundColor: themeOrg.color, borderColor: themeOrg.color }}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sreg-btn-submit"
                      onClick={handleSubmit}
                      disabled={!formData.certified || isSubmitting}
                      style={{
                        backgroundColor: themeOrg.color,
                        borderColor: themeOrg.color,
                        opacity: (!formData.certified || isSubmitting) ? 0.6 : 1,
                        cursor: (!formData.certified || isSubmitting) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmitting ? 'Submitting Registration…' : 'Submit Registration'}
                    </button>
                  )}
                </div>
          </div>
        </main>

        {/* ── Right Column: Interactive 3D ID Preview (1:1 Legacy System Match) */}
        <aside className="sreg-id-preview-col">
          <div className="sreg-id-preview-title">Live ID Preview</div>

          {/* Flip ID Button (exact match to legacy Screenshot 1 & 2) */}
          <button
            type="button"
            className="sreg-flip-id-btn"
            onClick={() => setIsFlipped((prev) => !prev)}
            title="Flip ID front and back"
          >
            <ArrowsClockwise size={15} />
            <span>Flip ID</span>
          </button>

          <div className="sreg-pup-id-card-wrap">
            <div className={`sreg-pup-id-card ${isFlipped ? 'flipped' : ''}`}>
              {/* FRONT FACE (Screenshot 1 Pixel-Accurate Match - NO signature slot) */}
              <div className="sreg-card-face sreg-card-front">
                <img
                  className="sreg-id-bg-img"
                  src="/img/id_front_preview.jpg?v=2"
                  alt="Front Preview Template"
                />
                <div className="sreg-id-overlay">
                  {/* Photo area (or light gray placeholder box) */}
                  <div className="sreg-id-photo-area">
                    {formData.photoUrl && (
                      <img src={formData.photoUrl} alt="Student Preview" />
                    )}
                  </div>

                  {/* Name Group */}
                  <div className="sreg-id-name-group">
                    <span className="sreg-id-name-first">{previewFirst}</span>
                    <span className="sreg-id-name-last">{previewLast}</span>
                  </div>

                  {/* Student Number (Underlined) */}
                  <div className="sreg-id-student-num">
                    {previewStudentNum}
                  </div>

                  {/* Course Name (Full Program Title without Program Code) */}
                  <div className="sreg-id-course-name">
                    {previewCourseFullName}
                  </div>
                </div>
              </div>

              {/* BACK FACE (Screenshot 2 Pixel-Accurate Match) */}
              <div className="sreg-card-face sreg-card-back">
                <img
                  className="sreg-id-bg-img"
                  src="/img/id_back.png"
                  alt="Back Preview Template"
                />
                <div className="sreg-id-overlay">
                  {/* Dynamic Fields Overlaid on Back Template */}
                  <div className="sreg-id-back-text sreg-id-b-dob">
                    {previewFormattedDob}
                  </div>
                  <div className="sreg-id-back-text sreg-id-b-address">
                    {previewResidentialAddress}
                  </div>
                  <div className="sreg-id-back-text sreg-id-b-emergency">
                    <strong>{previewEmergencyContact}</strong>
                  </div>
                  <div className="sreg-id-back-text sreg-id-b-emergency-address">
                    {previewEmergencyAddress}
                  </div>

                  {/* Signature Box on Back Face (Positioned directly in the orange box area) */}
                  <div className="sreg-id-b-signature-slot">
                    {formData.signatureUrl && (
                      <img
                        src={formData.signatureUrl}
                        alt="Student Signature"
                        className="sreg-id-b-sig-img"
                      />
                    )}
                  </div>

                  <div className="sreg-id-back-text sreg-id-b-validity-name">
                    {previewFullName}
                  </div>
                  <div className="sreg-id-back-text sreg-id-b-validity-period">
                    Acad Year 2025-2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>


      {/* ── Camera Capture Modal ────────────────────────────────────────── */}
      {isCameraOpen && (
        <div className="sreg-cam-modal-backdrop" onClick={closeCameraModal}>
          <div
            className="sreg-cam-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sreg-cam-modal-header">
              <div className="sreg-cam-modal-title-wrap">
                <VideoCamera size={20} weight="bold" style={{ color: themeOrg.color }} />
                <span className="sreg-cam-modal-title">Live ID Photo Capture</span>
              </div>

              {/* Camera Device Selector */}
              {videoDevices.length > 0 && (
                <div className="sreg-cam-device-wrap">
                  <label htmlFor="camDeviceSelect" className="sreg-cam-device-label">Device:</label>
                  <select
                    id="camDeviceSelect"
                    className="sreg-cam-device-select"
                    value={selectedDeviceId}
                    onChange={(e) => handleSwitchDevice(e.target.value)}
                  >
                    {videoDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {(d.label ? d.label.replace(/iriun\s*(webcam)?/gi, 'Camera').trim() : '') || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                className="sreg-cam-modal-close"
                onClick={closeCameraModal}
                title="Close Camera"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Viewfinder */}
            <div className="sreg-cam-modal-body">
              {cameraError ? (
                <div className="sreg-cam-error-state">
                  <WarningCircle size={36} color="#DC2626" weight="fill" />
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    className="sreg-btn-prev"
                    onClick={closeCameraModal}
                  >
                    Close & Use File Upload
                  </button>
                </div>
              ) : (
                <div className="sreg-cam-viewfinder-wrap">
                  {!snappedPhoto ? (
                    <>
                      <video
                        ref={videoRef}
                        className="sreg-cam-video"
                        autoPlay
                        playsInline
                        muted
                      />
                      {/* 1:1 Square Frame & Alignment Guides */}
                      <div className="sreg-cam-frame-overlay">
                        <div className="sreg-cam-corner top-left" />
                        <div className="sreg-cam-corner top-right" />
                        <div className="sreg-cam-corner bottom-left" />
                        <div className="sreg-cam-corner bottom-right" />
                        <div className="sreg-cam-oval-guide" />
                      </div>
                      <div className="sreg-cam-hint-pill">
                        Align face & shoulders inside the 1:1 frame
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={snappedPhoto}
                        alt="Captured ID snapshot"
                        className="sreg-cam-preview-img"
                      />
                      <div className="sreg-cam-hint-pill success">
                        Photo captured! Next step: Crop & frame (1500 × 1500).
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            {!cameraError && (
              <div className="sreg-cam-modal-footer">
                {!snappedPhoto ? (
                  <button
                    type="button"
                    className="sreg-cam-snap-btn"
                    onClick={snapPhoto}
                    style={{ backgroundColor: themeOrg.color }}
                  >
                    <Camera size={18} weight="fill" />
                    <span>Capture Photo</span>
                  </button>
                ) : (
                  <div className="sreg-cam-review-actions">
                    <button
                      type="button"
                      className="sreg-cam-retake-btn"
                      onClick={retakePhoto}
                    >
                      <ArrowCounterClockwise size={16} />
                      <span>Retake Photo</span>
                    </button>
                    <button
                      type="button"
                      className="sreg-cam-confirm-btn"
                      onClick={confirmPhoto}
                      style={{ backgroundColor: themeOrg.color }}
                    >
                      <CheckCircle size={17} weight="bold" />
                      <span>Crop & Use Photo</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Photo Cropper Modal (1500 × 1500 px Standard) ────────────────── */}
      {isCropperOpen && (
        <div className="sreg-modal-backdrop" onClick={closeCropperModal}>
          <div
            className="sreg-cropper-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sreg-cropper-modal-header">
              <div className="sreg-cropper-modal-title-wrap">
                <Crop size={20} weight="bold" style={{ color: themeOrg.color }} />
                <div>
                  <span className="sreg-cropper-modal-title">Crop ID Photo</span>
                  <span className="sreg-cropper-modal-spec">1500 × 1500 px Standard</span>
                </div>
              </div>
              <button
                type="button"
                className="sreg-cam-modal-close"
                onClick={closeCropperModal}
                title="Cancel Cropping"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sreg-cropper-modal-body">
              <div
                className="sreg-crop-viewport"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                title="Drag to position photo"
              >
                <img
                  src={cropImageSrc}
                  alt="Crop target"
                  className="sreg-crop-img"
                  style={{
                    transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom}) rotate(${cropRotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                  draggable={false}
                />
                {/* 1:1 ID Framing Overlay Guides */}
                <div className="sreg-crop-guide-overlay">
                  <div className="sreg-crop-guide-oval" />
                  <div className="sreg-crop-guide-line h1" />
                  <div className="sreg-crop-guide-line h2" />
                  <div className="sreg-crop-guide-line v1" />
                  <div className="sreg-crop-guide-line v2" />
                </div>
              </div>

              {/* Cropper Toolbar Controls */}
              <div className="sreg-crop-toolbar">
                <div className="sreg-crop-zoom-wrap">
                  <span className="sreg-crop-label">Zoom:</span>
                  <button
                    type="button"
                    className="sreg-crop-btn-mini"
                    onClick={() => setCropZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                    title="Zoom out"
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="sreg-crop-slider"
                    aria-label="Zoom Level"
                  />
                  <button
                    type="button"
                    className="sreg-crop-btn-mini"
                    onClick={() => setCropZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                    title="Zoom in"
                  >
                    <Plus size={13} />
                  </button>
                  <span className="sreg-crop-val">{(cropZoom * 100).toFixed(0)}%</span>
                </div>

                <div className="sreg-crop-tools-wrap">
                  <button
                    type="button"
                    className="sreg-crop-tool-btn"
                    onClick={() => setCropRotation((r) => (r + 90) % 360)}
                    title="Rotate 90 degrees clockwise"
                  >
                    <ArrowsClockwise size={14} />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    className="sreg-crop-tool-btn"
                    onClick={() => {
                      setCropZoom(1);
                      setCropOffset({ x: 0, y: 0 });
                      setCropRotation(0);
                    }}
                    title="Reset framing"
                  >
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="sreg-cropper-modal-footer">
              <button
                type="button"
                className="sreg-btn-prev"
                onClick={closeCropperModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sreg-cam-confirm-btn"
                onClick={handleApplyCrop}
                style={{ backgroundColor: themeOrg.color }}
              >
                <CheckCircle size={16} weight="bold" />
                <span>Apply Crop (1500 × 1500)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dedicated Signature Modal (2000 × 1200 px Standard) ───────────── */}
      {isSigModalOpen && (
        <div className="sreg-modal-backdrop" onClick={closeSignatureModal}>
          <div
            className="sreg-sig-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sreg-sig-modal-header">
              <div className="sreg-sig-modal-title-wrap">
                <PencilSimpleLine size={20} weight="bold" style={{ color: themeOrg.color }} />
                <div>
                  <span className="sreg-sig-modal-title">Student Digital Signature Pad</span>
                  <span className="sreg-sig-modal-spec">2000 × 1200 px · Pure White Background</span>
                </div>
              </div>
              <button
                type="button"
                className="sreg-cam-modal-close"
                onClick={closeSignatureModal}
                title="Close Signature Pad"
              >
                <X size={18} />
              </button>
            </div>

            {/* Brush & Tools Toolbar */}
            <div className="sreg-sig-modal-toolbar">
              <div className="sreg-sig-brush-control">
                <span className="sreg-sig-toolbar-label">Brush Size:</span>
                <div className="sreg-sig-thickness-pills">
                  {[
                    { label: 'Fine', size: 2.0 },
                    { label: 'Medium', size: 3.5 },
                    { label: 'Bold', size: 5.5 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`sreg-sig-pill ${sigBrushSize === p.size ? 'active' : ''}`}
                      onClick={() => setSigBrushSize(p.size)}
                      style={sigBrushSize === p.size ? { backgroundColor: themeOrg.color, borderColor: themeOrg.color, color: '#FFF' } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="1.5"
                  max="8"
                  step="0.5"
                  value={sigBrushSize}
                  onChange={(e) => setSigBrushSize(parseFloat(e.target.value))}
                  className="sreg-sig-brush-slider"
                  aria-label="Brush Thickness Slider"
                />
                <div
                  className="sreg-sig-brush-indicator"
                  style={{ width: `${Math.max(6, sigBrushSize * 2)}px`, height: `${Math.max(6, sigBrushSize * 2)}px` }}
                  title={`Brush width: ${sigBrushSize}px`}
                />
              </div>

              <div className="sreg-sig-toolbar-actions">
                <button
                  type="button"
                  className="sreg-sig-tool-btn"
                  onClick={handleModalUndo}
                  disabled={modalStrokesRef.current.length === 0}
                  title="Undo last stroke"
                >
                  <ArrowCounterClockwise size={15} />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  className="sreg-sig-tool-btn"
                  onClick={handleModalClear}
                  disabled={modalStrokesRef.current.length === 0}
                  title="Clear canvas"
                >
                  <Eraser size={15} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Drawing Canvas Body */}
            <div className="sreg-sig-modal-body">
              <div className="sreg-sig-modal-canvas-wrap">
                <canvas
                  ref={modalSigCanvasRef}
                  className="sreg-sig-modal-canvas"
                  onPointerDown={handleModalSigPointerDown}
                  onPointerMove={handleModalSigPointerMove}
                  onPointerUp={handleModalSigPointerUp}
                  onPointerCancel={handleModalSigPointerUp}
                />
                {modalStrokeCount === 0 && (
                  <div className="sreg-sig-watermark">
                    Draw your signature smoothly with your mouse or touchpad
                  </div>
                )}
                <div className="sreg-sig-baseline">
                  <span className="sreg-sig-x">✕</span>
                  <div className="sreg-sig-line" />
                </div>
              </div>
            </div>

            <div className="sreg-sig-modal-footer">
              <span className="sreg-sig-footer-hint">
                Use your mouse to sign above the baseline. Your signature is recorded in official 2000 × 1200 px resolution.
              </span>
              <div className="sreg-sig-footer-btns">
                <button
                  type="button"
                  className="sreg-btn-prev"
                  onClick={closeSignatureModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sreg-cam-confirm-btn"
                  onClick={handleSaveModalSignature}
                  style={{ backgroundColor: themeOrg.color }}
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Confirm & Save Signature</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Registration Submitted Success Modal ──────────────────────────── */}
      {isSubmitted && (
        <div className="sreg-modal-backdrop">
          <div className="sreg-success-modal-dialog">
            <div className="sreg-success-icon">
              <CheckCircle size={48} weight="fill" color="#16A34A" />
            </div>
            <h2 className="sreg-success-title">Registration Submitted!</h2>
            <p className="sreg-success-sub">
              Your student record has been received and queued for administrative review.
            </p>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="sreg-btn-next"
                onClick={() => {
                  setIsSubmitted(false);
                  handleReset();
                }}
                style={{
                  minWidth: 120,
                  justifyContent: 'center',
                  backgroundColor: themeOrg.color,
                  borderColor: themeOrg.color
                }}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Footer (Unified Footer Component) */}
      <Footer />
    </div>
  );
}
