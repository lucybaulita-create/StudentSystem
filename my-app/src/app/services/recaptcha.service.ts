import { Injectable } from '@angular/core';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  // IMPORTANT: Add your reCAPTCHA v2 site key from: https://www.google.com/recaptcha/admin
  // Get a v2 checkbox key for localhost/127.0.0.1
  // Leave empty string '' for development mode (mock tokens)
  private readonly RECAPTCHA_SITE_KEY = '6LeO6fYsAAAAAOoiN9zGYMDn4Q9YUPwji6nvs8Yq';

  private recaptchaToken: string | null = null;
  private isDevMode: boolean;
  private scriptLoaded = false;

  constructor() {
    this.isDevMode = !this.RECAPTCHA_SITE_KEY || this.RECAPTCHA_SITE_KEY.trim() === '';
    console.log(`[reCAPTCHA] Initialized - Mode: ${this.isDevMode ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    
    if (!this.isDevMode) {
      this.loadRecaptchaScript();
    }
  }

  /**
   * Load reCAPTCHA v2 script dynamically
   */
  private loadRecaptchaScript(): void {
    if (this.scriptLoaded || window.grecaptcha) {
      console.log('[reCAPTCHA] Script already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.scriptLoaded = true;
      console.log('[reCAPTCHA] v2 Script loaded successfully');
    };
    script.onerror = () => {
      console.error('[reCAPTCHA] Failed to load reCAPTCHA script');
      this.isDevMode = true; // Fallback to dev mode
    };
    document.head.appendChild(script);
  }

  /**
   * Get reCAPTCHA v2 token
   * In dev mode, returns a mock token immediately
   * In production, renders a checkbox widget
   */
  public getToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Development mode: return mock token
      if (this.isDevMode) {
        console.log('[reCAPTCHA] Dev mode - returning mock token');
        const mockToken = `mock-recaptcha-v2-${Date.now()}`;
        this.recaptchaToken = mockToken;
        resolve(mockToken);
        return;
      }

      // Production mode: use real reCAPTCHA
      if (!window.grecaptcha) {
        console.error('[reCAPTCHA] grecaptcha not available');
        reject(new Error('reCAPTCHA is not loaded'));
        return;
      }

      // Always render a fresh widget for security (don't use cached tokens)
      // Wrap in setTimeout to ensure widget is ready
      setTimeout(() => {
        this.renderCheckboxWidget(resolve, reject);
      }, 100);
    });
  }

  /**
   * Render reCAPTCHA v2 checkbox widget
   */
  private renderCheckboxWidget(resolve: (token: string) => void, reject: (error: Error) => void): void {
    const containerId = `recaptcha-container-${Date.now()}`;
    const overlayId = `recaptcha-overlay-${Date.now()}`;
    
    // Create modal overlay with very high z-index
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '999999';

    // Create modal box
    const modal = document.createElement('div');
    modal.style.backgroundColor = 'white';
    modal.style.padding = '60px';
    modal.style.borderRadius = '16px';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '9999999';
    modal.style.minWidth = '400px';
    modal.style.maxWidth = '600px';
    modal.style.position = 'relative';

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Security Check';
    title.style.margin = '0 0 15px 0';
    title.style.fontSize = '24px';
    title.style.color = '#1f2937';
    title.style.fontWeight = '700';

    // Create subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Please verify that you\'re not a robot';
    subtitle.style.margin = '0 0 40px 0';
    subtitle.style.fontSize = '16px';
    subtitle.style.color = '#666';

    // Create container for reCAPTCHA widget
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'inline-block';
    container.style.minHeight = '90px';
    container.style.marginBottom = '30px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f9fafb';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #e5e7eb';

    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(container);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    try {
      console.log('[reCAPTCHA] Rendering checkbox widget with site key:', this.RECAPTCHA_SITE_KEY?.substring(0, 10) + '...');
      window.grecaptcha.render(containerId, {
        sitekey: this.RECAPTCHA_SITE_KEY,
        theme: 'light',
        size: 'normal',
        callback: (token: string) => {
          console.log('[reCAPTCHA] Token callback - removing overlay');
          this.recaptchaToken = token;
          try {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          } catch (e) {
            console.warn('[reCAPTCHA] Error removing overlay:', e);
          }
          resolve(token);
        },
        'expired-callback': () => {
          console.log('[reCAPTCHA] Token expired');
          this.recaptchaToken = null;
        },
        'error-callback': () => {
          console.error('[reCAPTCHA] reCAPTCHA error');
          this.recaptchaToken = null;
          try {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          } catch (e) {
            console.warn('[reCAPTCHA] Error removing overlay:', e);
          }
          reject(new Error('reCAPTCHA verification failed'));
        }
      });
    } catch (error) {
      console.error('[reCAPTCHA] Error rendering widget:', error);
      try {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      } catch (e) {
        console.warn('[reCAPTCHA] Error removing overlay:', e);
      }
      reject(new Error(`Failed to render reCAPTCHA: ${error}`));
    }
  }

  /**
   * Reset reCAPTCHA token
   */
  public reset(): void {
    console.log('[reCAPTCHA] Reset called');
    if (!this.isDevMode && window.grecaptcha) {
      try {
        window.grecaptcha.reset();
      } catch (e) {
        console.error('[reCAPTCHA] Error resetting:', e);
      }
    }
    this.recaptchaToken = null;
  }

  /**
   * Check if running in development mode
   */
  public isDevelopmentMode(): boolean {
    return this.isDevMode;
  }

  /**
   * Get current site key
   */
  public getSiteKey(): string {
    return this.RECAPTCHA_SITE_KEY;
  }

  /**
   * Check if reCAPTCHA is ready
   */
  public isReady(): boolean {
    return this.isDevMode || !!window.grecaptcha;
  }
}
