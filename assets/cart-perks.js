class CartPerksController {
  constructor() {
    this.wasUnlocked = false;
    this.init();
  }

  init() {
    document.addEventListener('click', (event) => this.handleUpsellClick(event));

    const drawer = document.querySelector('#cart-drawer');
    if (!drawer) return;

    const observer = new MutationObserver(() => this.checkUnlockState());
    observer.observe(drawer, { childList: true, subtree: true });
    this.checkUnlockState();
  }

  async handleUpsellClick(event) {
    const button = event.target.closest('[data-upsell-variant-id]');
    if (!button || button.disabled) return;

    const variantId = Number(button.dataset.upsellVariantId);
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: 1 }],
          sections: 'cart-drawer-section',
          sections_url: window.location.pathname,
        }),
      });

      if (!response.ok) throw new Error('Failed to add upsell item');
      const data = await response.json();

      if (data.sections && data.sections['cart-drawer-section']) {
        this.hydrateDrawer(data.sections['cart-drawer-section']);
      }
    } catch (error) {
      console.error('Cart upsell error:', error);
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  hydrateDrawer(sectionHtml) {
    const doc = new DOMParser().parseFromString(sectionHtml, 'text/html');
    const incomingInner = doc.querySelector('[data-hydration-key="cart-drawer-inner"]');
    const currentInner = document.querySelector('[data-hydration-key="cart-drawer-inner"]');

    if (incomingInner && currentInner) {
      currentInner.innerHTML = incomingInner.innerHTML;
    }
  }

  checkUnlockState() {
    const bar = document.querySelector('.cart-shipping-bar');
    if (!bar) return;

    const isUnlocked = bar.dataset.shippingUnlocked === 'true';
    if (isUnlocked && !this.wasUnlocked) {
      bar.animate(
        [
          { transform: 'scale(1)', backgroundColor: 'transparent' },
          { transform: 'scale(1.015)', backgroundColor: 'rgb(var(--color-foreground-rgb) / 0.08)' },
          { transform: 'scale(1)', backgroundColor: 'transparent' },
        ],
        { duration: 450, easing: 'ease-out' }
      );
    }
    this.wasUnlocked = isUnlocked;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CartPerksController());
} else {
  new CartPerksController();
}