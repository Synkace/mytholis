const cards = document.querySelectorAll('.card');
let ticking = false;
let activeCard = null;

function activateCenterCard() {
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
        if (activeCard) {
            cards.forEach((card) => card.classList.remove('is-active'));
            activeCard = null;
        }
        return;
    }

    const viewportCenter = window.innerHeight * 0.52;
    let closestCard = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + (rect.height * 0.5);
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestCard = card;
        }
    }

    if (closestCard && closestCard !== activeCard) {
        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove('is-active');
        }
        closestCard.classList.add('is-active');
        activeCard = closestCard;
    }
}

const onScroll = () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            activateCenterCard();
            ticking = false;
        });
        ticking = true;
    }
};

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
window.addEventListener('load', activateCenterCard);

document.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.card');
    if (card && window.innerWidth <= 768 && card !== activeCard) {
        cards.forEach((c) => c.classList.remove('is-active'));
        card.classList.add('is-active');
        activeCard = card;
    }
}, { passive: true });

activateCenterCard();
