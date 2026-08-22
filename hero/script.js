const cards = document.querySelectorAll('.card');

function activateCenterCard() {
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
        cards.forEach((card) => card.classList.remove('is-active'));
        return;
    }

    const viewportCenter = window.innerHeight / 2;
    let closestCard = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
        card.classList.remove('is-active');

        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestCard = card;
        }
    });

    if (closestCard) {
        closestCard.classList.add('is-active');
    }
}

window.addEventListener('scroll', activateCenterCard, { passive: true });
window.addEventListener('resize', activateCenterCard);
window.addEventListener('load', activateCenterCard);
activateCenterCard();
