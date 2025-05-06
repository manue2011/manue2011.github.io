function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Mostrar la sección principal al cargar
document.addEventListener('DOMContentLoaded', function() {
    scrollToSection('principal');
});