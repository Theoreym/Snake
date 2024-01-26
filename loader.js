// Sélection des éléments du DOM
const terminal = document.querySelector(".terminal");
const hydra = document.querySelector(".hydra");
const rebootSuccessText = document.querySelector(".hydra_reboot_success");
const maxCharacters = 24;
const unloadedCharacter = ".";
const loadedCharacter = "#";
const spinnerFrames = ["/", "-", "\\", "|"];
let preloaderIterations = 0;
const maxIterations = 1;

// Clone l'élément et ajoute les classes glitch
(glitchElement => {
	const glitch = glitchElement.cloneNode(true);
	const glitchReverse = glitchElement.cloneNode(true);
	glitch.classList.add("glitch--clone", "glitch--bottom");
	glitchReverse.classList.add("glitch--clone", "glitch--top");
	glitch.setAttribute("aria-hidden", "true");
	glitchReverse.setAttribute("aria-hidden", "true");

	glitchElement.insertAdjacentElement("afterend", glitch);
	glitchElement.insertAdjacentElement("afterend", glitchReverse);
})(terminal);

// Obtient toutes les barres de chargement
const loadingBars = document.querySelectorAll(".loading-bar");
const processAmounts = document.querySelectorAll(".process-amount");
const spinners = document.querySelectorAll(".spinner");
const rebootingText = document.querySelectorAll(".hydra_rebooting");
const glitches = document.querySelectorAll(".glitch--clone");

// Fonction d'aide pour générer un nombre aléatoire
const RandomNumber = (min, max) => Math.floor(Math.random() * max) + min;

// Fonction de retard
const Delay = (time) => {
	return new Promise((resolve) => setTimeout(resolve, time))
};

// Fonction pour masquer tous les éléments
const HideAll = elements =>
	elements.forEach(glitchGroup =>
		glitchGroup.forEach(element => element.classList.add("hidden")));

// Fonction pour afficher tous les éléments
const ShowAll = elements =>
	elements.forEach(glitchGroup =>
		glitchGroup.forEach(element => element.classList.remove("hidden")));

// Fonction pour rendre la barre de chargement en HTML
const RenderBar = (values) => {
	const currentLoaded = values.lastIndexOf(loadedCharacter) + 1;
	const loaded = values.slice(0, currentLoaded).join("");
	const unloaded = values.slice(currentLoaded).join("");

	// Met à jour toutes les barres de chargement
	loadingBars.forEach(loadingBar => {
		loadingBar.innerHTML = `(${loaded}<span class="loading-bar--unloaded">${unloaded}</span>)`;
	});

	// Met à jour tous les pourcentages
	loadingPercent = Math.floor(currentLoaded / maxCharacters * 100);
	processAmounts.forEach(processAmount => {
		processAmount.innerText = loadingPercent;
	});
};

// Met à jour la valeur chargée et la rend en HTML
const DrawLoadingBar = (values) => {
	return new Promise((resolve) => {
		const loadingBarAnimation = setInterval(() => {
			if (!values.includes(unloadedCharacter)) {
				clearInterval(loadingBarAnimation);
				resolve();
			}

			values.pop(unloadedCharacter);
			values.unshift(loadedCharacter);
			RenderBar(values);
		}, RandomNumber(50, 300));
	});
};

// Anime le spinner
const DrawSpinner = (spinnerFrame = 0) => {
	return setInterval(() => {
		spinnerFrame += 1;
		spinners.forEach(
			spinner =>
				(spinner.innerText = `[${
					spinnerFrames[spinnerFrame % spinnerFrames.length]
				}]`)
		);
	}, RandomNumber(50, 300));
};

// Anime la boîte Hydra
const AnimateBox = () => {
	const first = hydra.getBoundingClientRect();
	HideAll([spinners, glitches, rebootingText]);
	rebootSuccessText.classList.remove("hidden");
	rebootSuccessText.style.visibility = "hidden";
	const last = hydra.getBoundingClientRect();

	const hydraAnimation = hydra.animate([
		{ transform: `scale(${first.width / last.width}, ${first.height / last.height})` },
		{ transform: `scale(${first.width / last.width}, 1.2)` },
		{ transform: `none` }
	], {
		duration: 600,
		easing: 'cubic-bezier(0,0,0.32,1)',
	});

	hydraAnimation.addEventListener('finish', () => {
		rebootSuccessText.removeAttribute("style");
		hydra.removeAttribute("style");
	});
};

// Fonction principale pour l'animation Hydra
const PlayHydra = async () => {
	terminal.classList.add("glitch");
	rebootSuccessText.classList.add("hidden");
	ShowAll([spinners, glitches, rebootingText]);
	const loadingBar = new Array(maxCharacters).fill(unloadedCharacter);
	const spinnerInterval = DrawSpinner();

	// Joue la barre de chargement
	await DrawLoadingBar(loadingBar);

	// Le chargement est complet au prochain frame, masque le spinner et le glitch
	requestAnimationFrame(() => {
		clearInterval(spinnerInterval);
		terminal.classList.remove("glitch");
		AnimateBox();
		if (++preloaderIterations < maxIterations) {
			setTimeout(PlayHydra, 5000);
		} else {
			console.log("Nombre maximum d'itérations atteint. Le préchargeur s'est arrêté.");
		}
	});
};

// Lance l'animation Hydra
PlayHydra();