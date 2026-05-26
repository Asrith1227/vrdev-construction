const adminUserId = "Varun";
const adminPassword = "NENI#2205";
const storageKey = "vrdev_data";
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const authStatus = document.getElementById("auth-status");
const logoutButton = document.getElementById("logout-button");
const adminArea = document.getElementById("admin-area");
const loggedInAs = document.getElementById("logged-in-as");
const projectList = document.getElementById("project-list");
const offersList = document.getElementById("offers-list");
const projectForm = document.getElementById("project-form");
const projectEditContainer = document.getElementById("project-edit-container");
const projectImagePreview = document.getElementById("project-image-preview");
const projectImageInput = document.getElementById("project-images");
const offerForm = document.getElementById("offer-form");
let isAdmin = false;
let appData = null;
let editingProjectIndex = null;
let editingOfferIndex = null;
let currentProjectImages = [];
const projectImageTimers = [];
const popupImageTimer = { id: null };
const projectCancelButton = document.getElementById("project-cancel");
const offerCancelButton = document.getElementById("offer-cancel");
const projectSubmitButton = document.getElementById("project-submit");
const offerSubmitButton = document.getElementById("offer-submit");
const slider = document.getElementById("hero-slider");
const slides = document.querySelectorAll(".hero-slider .slide");
const prevButton = document.getElementById("slide-prev");
const nextButton = document.getElementById("slide-next");
const dotsContainer = document.getElementById("slider-dots");
const languageButton = document.getElementById("language-button");
const languageMenu = document.getElementById("language-menu");
const languageOptions = document.querySelectorAll(".language-option");
let currentSlideIndex = 0;
let sliderTimer;
let currentLanguage = "en";
let popupImages = [];
let popupIndex = 0;
const popupOverlay = document.getElementById('image-popup');
const popupImage = document.getElementById('popup-image');
const popupClose = document.getElementById('popup-close');
const popupPrev = document.getElementById('popup-prev');
const popupNext = document.getElementById('popup-next');
const popupDots = document.getElementById('popup-dots');
const hasRemoteApi = location.protocol.startsWith('http');
const apiEndpoint = hasRemoteApi ? `${location.origin}/api/data` : null;

if (popupImage) {
  popupImage.onload = () => {
    popupImage.classList.add('loaded');
  };
}

const defaultData = {
  projects: [
    {
      title: "Skyline Tower Renovation",
      category: "Commercial",
      description: "Complete refurbishment of a premium office tower with cutting-edge design and sustainable materials.",
      date: "2026-05-12"
    },
    {
      title: "Harbor View Villas",
      category: "Residential",
      description: "Luxury waterfront homes with immersive VR-supported design walkthroughs for every client.",
      date: "2026-03-27"
    }
  ],
  offers: [
    {
      title: "Launch Discount",
      discount: "15% off",
      details: "Get 15% off architectural design consulting for the first 5 new contracts.",
      expires: "2026-10-31"
    }
  ]
};

function loadData() {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultData));
}

function saveDataLocally(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

async function saveData(data) {
  saveDataLocally(data);
  if (!apiEndpoint) return;
  try {
    await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.warn("Remote save failed, local data is still available.", error);
  }
}

async function fetchRemoteData() {
  if (!apiEndpoint) return null;
  try {
    const response = await fetch(apiEndpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("Remote fetch failed");
    const remoteData = await response.json();
    if (remoteData && typeof remoteData === "object") {
      appData = remoteData;
      saveDataLocally(appData);
      renderProjects();
      renderOffers();
      return appData;
    }
  } catch (error) {
    console.warn("Could not load remote data:", error);
  }
  return null;
}

function getData() {
  return appData || loadData();
}

function setAppData(data) {
  appData = data;
  saveDataLocally(data);
  saveData(data);
}

function deleteProject(index) {
  if (!isAdmin) {
    showMessage("Only signed-in admins can delete entries.");
    return;
  }
  const data = getData();
  data.projects.splice(index, 1);
  setAppData(data);
  renderProjects();
  showMessage("Project entry deleted.", "success");
}

function deleteOffer(index) {
  if (!isAdmin) {
    showMessage("Only signed-in admins can delete entries.");
    return;
  }
  const data = getData();
  data.offers.splice(index, 1);
  setAppData(data);
  renderOffers();
  showMessage("Offer entry deleted.", "success");
}

function moveProjectFormToEditArea() {
  if (!projectForm || !projectEditContainer) return;
  if (projectEditContainer.contains(projectForm)) return;
  projectEditContainer.style.display = "block";
  projectEditContainer.appendChild(projectForm);
}

function restoreProjectFormLocation() {
  const adminArea = document.getElementById("admin-area");
  if (!projectForm || !adminArea) return;
  if (adminArea.contains(projectForm)) return;
  adminArea.appendChild(projectForm);
  projectEditContainer.style.display = "none";
}

function renderProjectImagePreview() {
  if (!projectImagePreview) return;
  if (!currentProjectImages.length) {
    projectImagePreview.innerHTML = "<div class=\"preview-empty\">Existing images will appear here when editing a project.</div>";
    return;
  }

  projectImagePreview.innerHTML = currentProjectImages.map((src, index) => `
    <div class="preview-image-card">
      <img src="${src}" alt="Project image ${index + 1}" />
      <button type="button" class="remove-image-button" data-image-index="${index}" aria-label="Remove image">×</button>
    </div>
  `).join("");

  projectImagePreview.querySelectorAll('.remove-image-button').forEach((button) => {
    button.addEventListener('click', () => {
      const removeIndex = Number(button.dataset.imageIndex);
      if (Number.isFinite(removeIndex)) {
        currentProjectImages.splice(removeIndex, 1);
        renderProjectImagePreview();
      }
    });
  });
}

function startProjectEdit(index) {
  const data = getData();
  const project = data.projects[index];
  if (!project) return;
  document.getElementById("project-title").value = project.title;
  document.getElementById("project-category").value = project.category;
  document.getElementById("project-description").value = project.description;
  document.getElementById("project-date").value = project.date;
  currentProjectImages = Array.isArray(project.images) ? [...project.images] : [];
  renderProjectImagePreview();
  if (projectImageInput) projectImageInput.value = "";
  editingProjectIndex = index;
  editingOfferIndex = null;
  projectSubmitButton.textContent = "Save Project";
  projectCancelButton.style.display = "inline-flex";
  moveProjectFormToEditArea();
  projectForm.querySelector("h4").textContent = "Edit project";
  projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage("Editing project details. Save to update.", "success");
}

function resetProjectForm() {
  projectForm.reset();
  editingProjectIndex = null;
  currentProjectImages = [];
  renderProjectImagePreview();
  projectSubmitButton.textContent = "Publish Project";
  if (projectCancelButton) projectCancelButton.style.display = "none";
  if (projectImageInput) projectImageInput.value = "";
  projectForm.querySelector("h4").textContent = "Add new project";
  restoreProjectFormLocation();
}

function startOfferEdit(index) {
  const data = getData();
  const offer = data.offers[index];
  if (!offer) return;
  document.getElementById("offer-title").value = offer.title;
  document.getElementById("offer-discount").value = offer.discount;
  document.getElementById("offer-details").value = offer.details;
  document.getElementById("offer-expires").value = offer.expires;
  editingOfferIndex = index;
  editingProjectIndex = null;
  offerSubmitButton.textContent = "Save Offer";
  offerCancelButton.style.display = "inline-flex";
  showMessage("Editing offer details. Save to update.", "success");
}

function resetOfferForm() {
  offerForm.reset();
  editingOfferIndex = null;
  offerSubmitButton.textContent = "Publish Offer";
  if (offerCancelButton) offerCancelButton.style.display = "none";
}

function clearProjectImageTimers() {
  projectImageTimers.forEach((timer) => clearInterval(timer));
  projectImageTimers.length = 0;
}

function resetPopupTimer() {
  if (popupImageTimer.id) {
    clearInterval(popupImageTimer.id);
    popupImageTimer.id = null;
  }
  if (popupImages.length > 1) {
    popupImageTimer.id = setInterval(() => {
      updatePopupImage(popupIndex + 1);
    }, 3000);
  }
}

function renderPopupDots() {
  if (!popupDots) return;
  popupDots.innerHTML = popupImages.length > 1 ? popupImages.map((_, dotIndex) => `
      <button type="button" data-index="${dotIndex}" class="${popupIndex === dotIndex ? 'active' : ''}" aria-label="Show slide ${dotIndex + 1}"></button>
    `).join('') : "";
  popupDots.querySelectorAll('button').forEach((dot) => {
    dot.addEventListener('click', (event) => {
      const index = Number(event.currentTarget.dataset.index);
      updatePopupImage(index);
    });
  });
}

function loadPopupImage(src) {
  if (!popupImage) return;
  popupImage.classList.remove('loaded');
  const onLoad = () => {
    popupImage.classList.add('loaded');
    popupImage.removeEventListener('load', onLoad);
  };
  popupImage.addEventListener('load', onLoad);
  popupImage.src = src;
  if (popupImage.complete && popupImage.naturalWidth) {
    requestAnimationFrame(() => {
      popupImage.classList.add('loaded');
      popupImage.removeEventListener('load', onLoad);
    });
  }
}

function openImagePopup(images, index) {
  if (!popupOverlay || !popupImage || !popupPrev || !popupNext || !popupDots || !Array.isArray(images) || !images.length) return;
  popupImages = images;
  popupIndex = index % images.length;
  loadPopupImage(images[popupIndex]);
  popupOverlay.classList.add('open');
  popupOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  popupPrev.style.display = images.length > 1 ? 'inline-flex' : 'none';
  popupNext.style.display = images.length > 1 ? 'inline-flex' : 'none';
  renderPopupDots();
  resetPopupTimer();
}

function updatePopupImage(index) {
  if (!popupImage || !popupOverlay || !popupImages.length) return;
  popupIndex = (index + popupImages.length) % popupImages.length;
  loadPopupImage(popupImages[popupIndex]);
  renderPopupDots();
  resetPopupTimer();
}

function closeImagePopup() {
  if (!popupOverlay || !popupImage) return;
  popupOverlay.classList.remove('open');
  popupOverlay.setAttribute('aria-hidden', 'true');
  popupImage.src = '';
  document.body.classList.remove('no-scroll');
  if (popupImageTimer.id) {
    clearInterval(popupImageTimer.id);
    popupImageTimer.id = null;
  }
}

function startProjectImageRotation() {
  clearProjectImageTimers();
  document.querySelectorAll('.project-media').forEach((media) => {
    const images = JSON.parse(media.dataset.images || '[]');
    const imgEl = media.querySelector('img');
    const prevButton = media.querySelector('.image-nav.prev');
    const nextButton = media.querySelector('.image-nav.next');
    if (!images.length || !imgEl) return;

    let current = Number(media.dataset.index || 0);
    const updateImage = (index) => {
      current = (index + images.length) % images.length;
      media.dataset.index = String(current);
      imgEl.style.opacity = '0';
      const handleLoad = () => {
        imgEl.style.opacity = '1';
        imgEl.removeEventListener('load', handleLoad);
      };
      imgEl.addEventListener('load', handleLoad);
      imgEl.src = images[current];
    };

    media.addEventListener('click', () => {
      openImagePopup(images, current);
    });

    prevButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      updateImage(current - 1);
    });

    nextButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      updateImage(current + 1);
    });

    if (images.length > 1) {
      const timer = setInterval(() => {
        updateImage(current + 1);
      }, 3000);
      projectImageTimers.push(timer);
    }
  });
}

if (popupClose) {
  popupClose.addEventListener('click', closeImagePopup);
}

if (popupPrev) {
  popupPrev.addEventListener('click', (event) => {
    event.stopPropagation();
    updatePopupImage(popupIndex - 1);
  });
}

if (popupNext) {
  popupNext.addEventListener('click', (event) => {
    event.stopPropagation();
    updatePopupImage(popupIndex + 1);
  });
}

if (popupOverlay) {
  popupOverlay.addEventListener('click', (event) => {
    if (event.target === popupOverlay) {
      closeImagePopup();
    }
  });
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeImagePopup();
  }
});

function renderProjects() {
  const data = getData();
  projectList.innerHTML = "";
  clearProjectImageTimers();

  data.projects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "project-card";
    const images = Array.isArray(project.images) ? project.images : project.image ? [project.image] : [];
    const imageControls = images.length > 1 ? `
      <div class="project-media-controls">
        <button type="button" class="image-nav prev" aria-label="Previous image">‹</button>
        <button type="button" class="image-nav next" aria-label="Next image">›</button>
      </div>
    ` : "";
    const imageSection = images.length ? `
      <div class="project-media" data-images='${JSON.stringify(images)}' data-index="0">
        <img src="${images[0]}" alt="${project.title}" />
        ${imageControls}
      </div>
    ` : "";

    card.innerHTML = `
      <div class="project-card-grid">
        <div class="project-card-copy">
          <div class="card-top">
            <div>
              <h3>${project.title}</h3>
              <span class="card-subtitle">${project.category}</span>
            </div>
            ${isAdmin ? `<div class="card-actions"><button class="card-edit secondary-button" onclick="startProjectEdit(${index})">Edit</button><button class="card-delete" onclick="deleteProject(${index})">Delete</button></div>` : ""}
          </div>
          <p>${project.description}</p>
          <div class="card-footnote">
            <span>${project.date}</span>
          </div>
        </div>
        ${imageSection}
      </div>
    `;

    projectList.appendChild(card);
  });

  startProjectImageRotation();
}

function renderOffers() {
  const data = getData();
  offersList.innerHTML = "";
  data.offers.forEach((offer, index) => {
    const card = document.createElement("article");
    card.className = "offer-card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="offer-badge">${offer.discount}</div>
          <span class="card-subtitle">${offer.title}</span>
        </div>
        ${isAdmin ? `<div class="card-actions"><button class="card-edit secondary-button" onclick="startOfferEdit(${index})">Edit</button><button class="card-delete" onclick="deleteOffer(${index})">Delete</button></div>` : ""}
      </div>
      <p>${offer.details}</p>
      <div class="card-footnote">
        <span>Expires: ${offer.expires}</span>
      </div>
    `;
    offersList.appendChild(card);
  });
}

function setAdminMode(enabled, id = "") {
  isAdmin = enabled;
  if (enabled) {
    authStatus.textContent = "Logged in as " + id;
    authStatus.classList.remove("error");
    authStatus.classList.add("success");
    adminArea.style.display = "block";
    loggedInAs.textContent = id;
    logoutButton.style.display = "inline-flex";
  } else {
    authStatus.textContent = "You are viewing the public site.";
    authStatus.classList.remove("success");
    authStatus.classList.remove("error");
    adminArea.style.display = "none";
    logoutButton.style.display = "none";
  }
  renderProjects();
  renderOffers();
}

function initAuth() {
  const savedAdmin = sessionStorage.getItem("vrdev_user");
  if (savedAdmin === adminUserId) {
    setAdminMode(true, savedAdmin);
  } else {
    setAdminMode(false);
  }
}

function showMessage(message, type = "error") {
  authMessage.textContent = message;
  authMessage.style.display = "block";
  authMessage.style.color = type === "success" ? "#31d0aa" : "#f06595";
}

function createSliderDots() {
  if (!dotsContainer) return;
  dotsContainer.innerHTML = "";
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = index === 0 ? "active" : "non-active";
    dot.setAttribute("aria-label", `Slide ${index + 1}`);
    dotsContainer.appendChild(dot);
  });
}

function updateSliderState(index) {
  if (!slides.length) return;
  currentSlideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === currentSlideIndex);
  });
  if (!dotsContainer) return;
  dotsContainer.querySelectorAll("button").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === currentSlideIndex);
  });
}

function nextSlide() {
  updateSliderState(currentSlideIndex + 1);
}

function prevSlide() {
  updateSliderState(currentSlideIndex - 1);
}

function startSlider() {
  sliderTimer = setInterval(nextSlide, 3000);
}

function resetSliderTimer() {
  clearInterval(sliderTimer);
  startSlider();
}

function initSlider() {
  if (!slides.length) return;
  createSliderDots();
  updateSliderState(0);
  nextButton?.addEventListener("click", () => {
    nextSlide();
    resetSliderTimer();
  });
  prevButton?.addEventListener("click", () => {
    prevSlide();
    resetSliderTimer();
  });
  dotsContainer?.addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName !== "BUTTON") return;
    const index = Array.from(dotsContainer.children).indexOf(target);
    if (index >= 0) {
      updateSliderState(index);
      resetSliderTimer();
    }
  });
  startSlider();
}

function applyLanguage(lang) {
  const textMap = {
    en: {
      services: "Services",
      projects: "Projects",
      offers: "Offers",
      contact: "Contact",
      admin: "Admin Login",
      about: "About",
      residential: "Residential",
      offices: "Offices",
      rentals: "Rentals",
      hospitality: "Hospitality",
      retail: "Retail",
      language: "Language",
      seeProjects: "See Projects",
      currentOffers: "Current Offers",
      heroTitle: "Build impressive structures with VR Developers Construction",
      heroText: "A modern construction partner for commercial, residential, and industrial projects. Showcase your completed work, promote discounts, and manage new offers from a single admin portal.",
      whyTitle: "Why VR Developers?"
    },
    es: {
      services: "Servicios",
      projects: "Proyectos",
      offers: "Ofertas",
      contact: "Contacto",
      admin: "Admin",
      about: "Acerca",
      residential: "Residencial",
      offices: "Oficinas",
      rentals: "Alquileres",
      hospitality: "Hospitalidad",
      retail: "Retail",
      language: "Idioma",
      seeProjects: "Ver Proyectos",
      currentOffers: "Ofertas Actuales",
      heroTitle: "Construye estructuras impresionantes con VR Developers Construction",
      heroText: "Un socio de construcción moderno para proyectos comerciales, residenciales e industriales. Exhibe tu trabajo terminado, promociona descuentos y administra nuevas ofertas desde un solo portal de administración.",
      whyTitle: "¿Por qué VR Developers?"
    }
  };

  const labels = textMap[lang] || textMap.en;
  const navMain = document.querySelectorAll(".nav-main a");
  const navCategories = document.querySelectorAll(".nav-categories a");

  if (navMain.length >= 4) {
    navMain[0].textContent = labels.services;
    navMain[1].textContent = labels.projects;
    navMain[2].textContent = labels.offers;
    navMain[3].textContent = labels.contact;
  }
  if (navCategories.length >= 6) {
    navCategories[0].textContent = labels.about;
    navCategories[1].textContent = labels.residential;
    navCategories[2].textContent = labels.offices;
    navCategories[3].textContent = labels.rentals;
    navCategories[4].textContent = labels.hospitality;
    navCategories[5].textContent = labels.retail;
  }
  // Update side-menu items (we moved the category links into the off-canvas side menu)
  const sideItems = document.querySelectorAll('.side-menu .menu-item');
  if (sideItems.length >= 6) {
    sideItems[0].textContent = labels.about;
    sideItems[1].textContent = labels.residential;
    sideItems[2].textContent = labels.offices;
    sideItems[3].textContent = labels.rentals;
    sideItems[4].textContent = labels.hospitality;
    sideItems[5].textContent = labels.retail;
  }
  const sideAdmin = document.querySelector('.side-menu .menu-item.button');
  if (sideAdmin) sideAdmin.textContent = labels.admin;
  document.getElementById("language-button").textContent = labels.language;
  document.querySelector(".hero-copy h1").textContent = labels.heroTitle;
  document.querySelector(".hero-copy p").textContent = labels.heroText;
  document.querySelector(".stats-card h3").textContent = labels.whyTitle;
  document.querySelector(".form-actions .button").textContent = labels.seeProjects;
  document.querySelector(".form-actions .secondary-button").textContent = labels.currentOffers;
  currentLanguage = lang;
  languageOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.lang === lang);
  });
}

function toggleLanguageMenu() {
  if (!languageMenu) return;
  languageMenu.classList.toggle("open");
}

languageButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleLanguageMenu();
});

languageOptions.forEach((option) => {
  option.addEventListener("click", (event) => {
    const selectedLang = option.dataset.lang;
    applyLanguage(selectedLang);
    languageMenu?.classList.remove("open");
  });
});

document.addEventListener("click", (event) => {
  if (!languageMenu?.contains(event.target) && event.target !== languageButton) {
    languageMenu?.classList.remove("open");
  }
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("user-id");
  const passwordInput = document.getElementById("password");
  const value = input.value.trim();
  const password = passwordInput.value.trim();

  if (!value || !password) {
    showMessage("Please enter both user ID and password.");
    return;
  }

  if (value.toLowerCase() === adminUserId.toLowerCase() && password === adminPassword) {
    sessionStorage.setItem("vrdev_user", adminUserId);
    setAdminMode(true, adminUserId);
    showMessage("Login successful. You can now add projects and offers.", "success");
    input.value = "";
    passwordInput.value = "";
  } else {
    showMessage("Invalid credentials. Check your user ID and password.");
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("vrdev_user");
  setAdminMode(false);
  showMessage("Logged out successfully.", "success");
});

async function readProjectImages() {

  if (!projectImageInput || !projectImageInput.files?.length) {
    return [];
  }

  const files = Array.from(projectImageInput.files)
    .filter((file) => file.type.startsWith("image/"));

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  try {

    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const uploadedImages = await response.json();

    return uploadedImages;

  } catch (error) {

    console.error(error);

    showMessage("Could not upload images.");

    return [];
  }
}

async function appendSelectedProjectImages() {
  if (!projectImageInput) return;
  let addedImages = [];
  try {
    addedImages = await readProjectImages();
  } catch (error) {
    showMessage("Could not read selected images. Please try again.");
    return;
  }

  if (addedImages.length) {
    currentProjectImages.push(...addedImages);
    renderProjectImagePreview();
    projectImageInput.value = "";
  }
}

projectImageInput?.addEventListener("change", appendSelectedProjectImages);

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = document.getElementById("project-title").value.trim();
  const category = document.getElementById("project-category").value.trim();
  const description = document.getElementById("project-description").value.trim();
  const date = document.getElementById("project-date").value;

  if (!title || !category || !description || !date) {
    showMessage("Please fill in all project fields.");
    return;
  }

  // Ensure any selected images are appended before saving.
  await appendSelectedProjectImages();

  const finalImages = [...currentProjectImages];

  const data = getData();
  const projectItem = { title, category, description, date };
  if (finalImages.length) {
    projectItem.images = finalImages;
  }

  if (editingProjectIndex !== null) {
    data.projects[editingProjectIndex] = projectItem;
    showMessage("Project updated successfully.", "success");
  } else {
    data.projects.unshift(projectItem);
    showMessage("New project added successfully.", "success");
  }

  setAppData(data);
  renderProjects();
  resetProjectForm();
});

offerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("offer-title").value.trim();
  const discount = document.getElementById("offer-discount").value.trim();
  const details = document.getElementById("offer-details").value.trim();
  const expires = document.getElementById("offer-expires").value;

  if (!title || !discount || !details || !expires) {
    showMessage("Please fill in all offer fields.");
    return;
  }

  const data = getData();
  const offerItem = { title, discount, details, expires };

  if (editingOfferIndex !== null) {
    data.offers[editingOfferIndex] = offerItem;
    showMessage("Offer updated successfully.", "success");
  } else {
    data.offers.unshift(offerItem);
    showMessage("New offer added successfully.", "success");
  }

  setAppData(data);
  renderOffers();
  resetOfferForm();
});

if (projectCancelButton) {
  projectCancelButton.addEventListener("click", resetProjectForm);
}

if (offerCancelButton) {
  offerCancelButton.addEventListener("click", resetOfferForm);
}

appData = loadData();
renderProjects();
renderOffers();
if (hasRemoteApi) {
  fetchRemoteData();
}
initAuth();
initSlider();

// Side menu (off-canvas) behavior
const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.getElementById('side-menu');
const menuClose = document.getElementById('menu-close');
const sideMenuItems = document.querySelectorAll('.side-menu .menu-item');

function openSideMenu() {
  if (!sideMenu) return;
  sideMenu.classList.add('open');
  sideMenu.setAttribute('aria-hidden', 'false');
}

function closeSideMenu() {
  if (!sideMenu) return;
  sideMenu.classList.remove('open');
  sideMenu.setAttribute('aria-hidden', 'true');
}

menuToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  openSideMenu();
});

menuClose?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeSideMenu();
});

sideMenuItems.forEach((el) => {
  el.addEventListener('click', () => {
    // close menu after navigation click
    closeSideMenu();
  });
});

document.addEventListener('click', (e) => {
  if (!sideMenu) return;
  if (sideMenu.classList.contains('open') && !sideMenu.contains(e.target) && e.target !== menuToggle) {
    closeSideMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSideMenu();
});
