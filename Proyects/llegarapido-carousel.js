document.addEventListener('DOMContentLoaded', function () {
    var carouselElement = document.querySelector('#llegarapidoCarousel');
    if (carouselElement) {
        var carousel = new bootstrap.Carousel(carouselElement, {
            interval: 3000,
            ride: 'carousel',
            pause: 'hover',
            wrap: true
        });
    }
});
