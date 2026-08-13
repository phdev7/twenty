import { Injectable } from '@nestjs/common';

import { FormFieldType } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { FormLayout } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import {
  type DiexPublishedFormField,
  type DiexPublishedFormSnapshot,
} from 'src/engine/core-modules/diex-forms/types/diex-form.types';

type RenderPublicFormInput = {
  snapshot: DiexPublishedFormSnapshot;
  token: string;
  submitUrl: string;
  workspaceName?: string | null;
  workspaceLogoUrl?: string | null;
  nonce: string;
};

@Injectable()
export class DiexFormsPublicRendererService {
  render({
    snapshot,
    token,
    submitUrl,
    workspaceName,
    workspaceLogoUrl,
    nonce,
  }: RenderPublicFormInput): string {
    const accentColor = /^#[0-9a-f]{6}$/i.test(snapshot.accentColor)
      ? snapshot.accentColor
      : '#6C5CE7';
    const logoUrl = snapshot.logoUrl ?? workspaceLogoUrl ?? null;
    const safeSubmitUrl = this.escapeHtml(submitUrl);
    const clientConfig = this.safeJson({
      layout: snapshot.layout,
      submitUrl,
      token,
    });
    const questions = snapshot.fields
      .map((field, index) =>
        this.renderQuestion(field, index, snapshot.fields.length),
      )
      .join('');
    const logo =
      snapshot.showLogo && logoUrl
        ? `<img class="brand-logo" src="${this.escapeHtml(logoUrl)}" alt="${this.escapeHtml(workspaceName ?? snapshot.title)}" referrerpolicy="no-referrer" />`
        : snapshot.showLogo
          ? `<div class="brand-mark" aria-hidden="true">D</div>`
          : '';
    const brand = logo ? `<div class="brand">${logo}</div>` : '';
    const description = snapshot.description
      ? `<p class="intro-copy">${this.escapeHtml(snapshot.description)}</p>`
      : '';
    const consent = snapshot.consentRequired
      ? `<label class="consent" id="consent-block">
           <input type="checkbox" name="_consent" value="true" required />
           <span>${this.escapeHtml(snapshot.consentText ?? 'Autorizo o uso dos dados enviados para atendimento e contato comercial.')}</span>
         </label>`
      : '';
    const privacy = snapshot.privacyPolicyUrl
      ? `<a class="privacy-link" href="${this.escapeHtml(snapshot.privacyPolicyUrl)}" target="_blank" rel="noopener noreferrer">Política de privacidade</a>`
      : '';

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <meta name="referrer" content="no-referrer" />
  <title>${this.escapeHtml(snapshot.title)}</title>
  <style nonce="${nonce}">
    :root { color-scheme: light; --accent: ${accentColor}; --ink: #16161b; --muted: #707078; --line: #e8e8ed; --surface: rgba(255,255,255,.94); }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body { margin: 0; color: var(--ink); font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at 15% 10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 35%), radial-gradient(circle at 90% 85%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 30%), #f7f7f9; }
    button, input, textarea, select { font: inherit; }
    .page { min-height: 100dvh; padding: max(24px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); display: grid; place-items: center; }
    .shell { width: min(100%, 720px); }
    .brand { min-height: 48px; margin: 0 0 20px; display: flex; align-items: center; gap: 12px; }
    .brand-logo { display: block; max-width: 180px; max-height: 52px; object-fit: contain; object-position: left center; }
    .brand-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: var(--accent); color: #fff; font-weight: 800; font-size: 20px; box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 26%, transparent); }
    .card { overflow: hidden; border: 1px solid rgba(21,21,26,.08); border-radius: 24px; background: var(--surface); box-shadow: 0 24px 80px rgba(24,24,34,.10); backdrop-filter: blur(18px); }
    .progress-track { height: 5px; background: #ececf1; }
    .progress-value { height: 100%; width: 0; background: var(--accent); transition: width .28s ease; }
    .content { padding: clamp(24px, 6vw, 52px); }
    .eyebrow { margin: 0 0 10px; color: var(--accent); font-size: 12px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(28px, 6vw, 42px); line-height: 1.08; letter-spacing: -.035em; }
    .intro-copy { max-width: 580px; margin: 14px 0 0; color: var(--muted); font-size: 16px; line-height: 1.6; }
    .question-list { margin-top: 34px; }
    .question { display: none; animation: enter .26s ease both; }
    .question.is-visible, .single-page .question { display: block; }
    .single-page .question + .question { margin-top: 30px; padding-top: 30px; border-top: 1px solid var(--line); }
    @keyframes enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .question-index { display: inline-flex; margin-bottom: 10px; color: var(--accent); font-size: 13px; font-weight: 700; }
    .question-label { display: block; margin: 0 0 8px; font-size: clamp(20px, 4.2vw, 28px); font-weight: 720; line-height: 1.25; letter-spacing: -.02em; }
    .required { color: var(--accent); }
    .help { margin: 0 0 14px; color: var(--muted); font-size: 14px; line-height: 1.5; }
    .control { width: 100%; min-height: 54px; border: 1px solid #dcdce3; border-radius: 14px; outline: none; background: #fff; color: var(--ink); padding: 14px 16px; transition: border-color .18s, box-shadow .18s; }
    .control:focus { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent); }
    textarea.control { min-height: 132px; resize: vertical; line-height: 1.55; }
    .choices { display: grid; gap: 10px; }
    .choice { position: relative; display: flex; align-items: center; gap: 12px; min-height: 54px; padding: 13px 15px; border: 1px solid #dcdce3; border-radius: 14px; background: #fff; cursor: pointer; transition: border-color .18s, background .18s, transform .18s; }
    .choice:hover { border-color: color-mix(in srgb, var(--accent) 55%, #dcdce3); transform: translateY(-1px); }
    .choice:has(input:checked) { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, white); }
    .choice input { width: 18px; height: 18px; margin: 0; accent-color: var(--accent); }
    .rating { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .rating .choice { justify-content: center; padding: 13px 4px; }
    .rating .choice input { position: absolute; opacity: 0; pointer-events: none; }
    .actions { margin-top: 30px; display: flex; align-items: center; gap: 10px; }
    .button { min-height: 48px; border: 0; border-radius: 13px; padding: 0 20px; cursor: pointer; font-weight: 720; transition: transform .16s, opacity .16s, box-shadow .16s; }
    .button:hover { transform: translateY(-1px); }
    .button:disabled { cursor: wait; opacity: .58; transform: none; }
    .button-primary { margin-left: auto; background: var(--accent); color: #fff; box-shadow: 0 10px 24px color-mix(in srgb, var(--accent) 23%, transparent); }
    .button-secondary { background: #ededf1; color: #48484f; }
    .step-count { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
    .consent { display: flex; gap: 10px; margin-top: 24px; color: #5f5f67; font-size: 13px; line-height: 1.5; }
    .consent input { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 1px; accent-color: var(--accent); }
    .form-footer { min-height: 28px; padding-top: 18px; display: flex; justify-content: space-between; align-items: center; gap: 16px; color: #92929a; font-size: 12px; }
    .privacy-link { color: inherit; }
    .hp { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0,0,0,0) !important; white-space: nowrap !important; }
    .error { min-height: 22px; margin-top: 14px; color: #b42318; font-size: 13px; }
    .success { display: none; padding: clamp(38px, 8vw, 72px) clamp(24px, 6vw, 52px); text-align: center; }
    .success.is-visible { display: block; }
    .success-icon { width: 58px; height: 58px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--accent) 12%, white); color: var(--accent); font-size: 28px; font-weight: 800; }
    .success h2 { margin: 0; font-size: clamp(27px, 5vw, 38px); letter-spacing: -.03em; }
    .success p { margin: 12px auto 0; max-width: 520px; color: var(--muted); line-height: 1.65; }
    @media (max-width: 520px) { .page { align-items: start; padding-top: 18px; } .brand { margin-bottom: 14px; } .card { border-radius: 19px; } .content { padding: 26px 20px; } .actions { flex-wrap: wrap; } .step-count { order: 3; width: 100%; text-align: right; } .rating { gap: 6px; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; } }
  </style>
</head>
<body>
  <main class="page">
    <div class="shell">
      ${brand}
      <section class="card" aria-labelledby="form-title">
        <div class="progress-track" aria-hidden="true"><div class="progress-value" id="progress"></div></div>
        <div class="content" id="form-content">
          <p class="eyebrow">Formulário seguro</p>
          <h1 id="form-title">${this.escapeHtml(snapshot.title)}</h1>
          ${description}
          <form id="lead-form" action="${safeSubmitUrl}" method="post" novalidate>
            <div class="question-list${snapshot.layout === FormLayout.SINGLE_PAGE ? ' single-page' : ''}" id="question-list">
              ${questions}
            </div>
            <label class="hp" aria-hidden="true">Não preencha este campo<input name="_hp" tabindex="-1" autocomplete="off" /></label>
            ${consent}
            <div class="error" id="form-error" role="alert" aria-live="polite"></div>
            <div class="actions">
              <button class="button button-secondary" id="previous" type="button">Voltar</button>
              <span class="step-count" id="step-count"></span>
              <button class="button button-primary" id="next" type="button">Continuar</button>
              <button class="button button-primary" id="submit" type="submit">${this.escapeHtml(snapshot.submitButtonLabel)}</button>
            </div>
          </form>
          <footer class="form-footer"><span>Protegido por Diex Forms</span>${privacy}</footer>
        </div>
        <div class="success" id="success" role="status" aria-live="polite">
          <div class="success-icon">✓</div>
          <h2>${this.escapeHtml(snapshot.successTitle)}</h2>
          <p>${this.escapeHtml(snapshot.successMessage)}</p>
        </div>
      </section>
    </div>
  </main>
  <script nonce="${nonce}">
    (() => {
      'use strict';
      const config = ${clientConfig};
      const form = document.getElementById('lead-form');
      const steps = Array.from(document.querySelectorAll('.question'));
      const progress = document.getElementById('progress');
      const previous = document.getElementById('previous');
      const next = document.getElementById('next');
      const submit = document.getElementById('submit');
      const count = document.getElementById('step-count');
      const error = document.getElementById('form-error');
      const consent = document.getElementById('consent-block');
      const isSinglePage = config.layout === 'SINGLE_PAGE';
      let current = 0;
      const idempotencyKey = window.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(16).slice(2);

      const setError = (message) => { error.textContent = message || ''; };
      const showStep = () => {
        steps.forEach((step, index) => step.classList.toggle('is-visible', isSinglePage || index === current));
        const last = current === steps.length - 1;
        previous.hidden = isSinglePage || current === 0;
        next.hidden = isSinglePage || last;
        submit.hidden = !isSinglePage && !last;
        if (consent) consent.hidden = !isSinglePage && !last;
        count.textContent = isSinglePage ? '' : String(current + 1) + ' de ' + String(steps.length);
        progress.style.width = isSinglePage ? '100%' : String(((current + 1) / steps.length) * 100) + '%';
        setError('');
        const focusable = steps[current]?.querySelector('input:not([type="hidden"]), textarea, select');
        if (!isSinglePage && focusable) window.setTimeout(() => focusable.focus({ preventScroll: true }), 80);
      };
      const validateContainer = (container) => {
        const controls = Array.from(container.querySelectorAll('input, textarea, select'));
        const requiredGroups = new Set(controls.filter((item) => item.required && (item.type === 'radio' || item.type === 'checkbox')).map((item) => item.name));
        for (const name of requiredGroups) {
          const checked = controls.some((item) => item.name === name && item.checked);
          if (!checked) {
            setError('Escolha ao menos uma opção para continuar.');
            controls.find((item) => item.name === name)?.focus();
            return false;
          }
        }
        for (const control of controls) {
          if ((control.type === 'radio' || control.type === 'checkbox') && requiredGroups.has(control.name)) continue;
          if (!control.checkValidity()) {
            control.reportValidity();
            return false;
          }
        }
        return true;
      };
      next.addEventListener('click', () => {
        if (!validateContainer(steps[current])) return;
        current = Math.min(steps.length - 1, current + 1);
        showStep();
      });
      previous.addEventListener('click', () => {
        current = Math.max(0, current - 1);
        showStep();
      });
      form.addEventListener('keydown', (event) => {
        if (!isSinglePage && event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && current < steps.length - 1) {
          event.preventDefault();
          next.click();
        }
      });
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const validationTarget = isSinglePage ? form : steps[current];
        if (!validateContainer(validationTarget)) return;
        if (consent && !validateContainer(consent)) return;
        setError('');
        submit.disabled = true;
        submit.textContent = 'Enviando…';
        const body = {};
        for (const [key, value] of new FormData(form).entries()) {
          if (Object.prototype.hasOwnProperty.call(body, key)) body[key] = Array.isArray(body[key]) ? [...body[key], value] : [body[key], value];
          else body[key] = value;
        }
        body._token = config.token;
        body._landing_page = window.location.href.slice(0, 500);
        body._referrer = document.referrer.slice(0, 500);
        const params = new URLSearchParams(window.location.search);
        for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
          if (params.get(key)) body['_' + key] = params.get(key).slice(0, 500);
        }
        try {
          const response = await fetch(config.submitUrl, {
            method: 'POST',
            credentials: 'omit',
            headers: { 'content-type': 'application/json', 'x-idempotency-key': idempotencyKey },
            body: JSON.stringify(body),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.success) throw new Error(result.message || 'Não foi possível enviar agora.');
          document.getElementById('form-content').hidden = true;
          document.getElementById('success').classList.add('is-visible');
          progress.style.width = '100%';
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Não foi possível enviar agora. Tente novamente.');
          submit.disabled = false;
          submit.textContent = ${this.safeJson(snapshot.submitButtonLabel)};
        }
      });
      showStep();
    })();
  </script>
</body>
</html>`;
  }

  private renderQuestion(
    field: DiexPublishedFormField,
    index: number,
    total: number,
  ): string {
    const id = `field-${index}`;
    const required = field.isRequired ? ' required' : '';
    const requiredMark = field.isRequired
      ? ' <span class="required" aria-hidden="true">*</span>'
      : '';
    const help = field.helpText
      ? `<p class="help" id="${id}-help">${this.escapeHtml(field.helpText)}</p>`
      : '';
    const describedBy = field.helpText ? ` aria-describedby="${id}-help"` : '';
    const control = this.renderControl(field, id, required, describedBy);

    return `<section class="question" data-step="${index}">
      <span class="question-index">${index + 1} / ${total}</span>
      <div class="question-label" id="${id}-label">${this.escapeHtml(field.label)}${requiredMark}</div>
      ${help}
      ${control}
    </section>`;
  }

  private renderControl(
    field: DiexPublishedFormField,
    id: string,
    required: string,
    describedBy: string,
  ): string {
    const name = this.escapeHtml(field.name);
    const placeholder = field.placeholder
      ? ` placeholder="${this.escapeHtml(field.placeholder)}"`
      : '';
    const minLength = this.numericAttribute(
      'minlength',
      field.validation.minLength,
    );
    const maxLength = this.numericAttribute(
      'maxlength',
      field.validation.maxLength,
    );
    const min = this.numericAttribute('min', field.validation.min);
    const max = this.numericAttribute('max', field.validation.max);
    const common = `id="${id}" name="${name}" class="control" aria-labelledby="${id}-label"${placeholder}${required}${describedBy}`;

    switch (field.type) {
      case FormFieldType.TEXTAREA:
        return `<textarea ${common}${minLength}${maxLength}></textarea>`;
      case FormFieldType.SELECT:
        return `<select ${common}><option value="">Selecione uma opção</option>${field.options.map((option) => `<option value="${this.escapeHtml(option.value)}">${this.escapeHtml(option.label)}</option>`).join('')}</select>`;
      case FormFieldType.RADIO:
      case FormFieldType.MULTI_SELECT:
        return this.renderChoices(field, id, describedBy);
      case FormFieldType.CHECKBOX:
        return `<div class="choices" role="group" aria-labelledby="${id}-label"><label class="choice"><input id="${id}" type="checkbox" name="${name}" value="true"${required}${describedBy} /><span>Sim</span></label></div>`;
      case FormFieldType.RATING:
        return this.renderRating(field, id, describedBy);
      case FormFieldType.EMAIL:
        return `<input ${common} type="email" inputmode="email" autocomplete="email"${minLength}${maxLength} />`;
      case FormFieldType.PHONE:
        return `<input ${common} type="tel" inputmode="tel" autocomplete="tel"${minLength}${maxLength} />`;
      case FormFieldType.NUMBER:
        return `<input ${common} type="number" inputmode="decimal"${min}${max} />`;
      case FormFieldType.CURRENCY:
        return `<input ${common} type="number" inputmode="decimal" step="0.01"${min}${max} />`;
      case FormFieldType.DATE:
        return `<input ${common} type="date" />`;
      case FormFieldType.URL:
        return `<input ${common} type="url" inputmode="url" />`;
      default:
        return `<input ${common} type="text"${minLength}${maxLength} />`;
    }
  }

  private renderChoices(
    field: DiexPublishedFormField,
    id: string,
    describedBy: string,
  ): string {
    const type =
      field.type === FormFieldType.MULTI_SELECT ? 'checkbox' : 'radio';

    return `<div class="choices" id="${id}" role="group" aria-labelledby="${id}-label">${field.options
      .map(
        (option, optionIndex) =>
          `<label class="choice"><input type="${type}" name="${this.escapeHtml(field.name)}" value="${this.escapeHtml(option.value)}"${field.isRequired && optionIndex === 0 ? ' required' : ''}${describedBy} /><span>${this.escapeHtml(option.label)}</span></label>`,
      )
      .join('')}</div>`;
  }

  private renderRating(
    field: DiexPublishedFormField,
    id: string,
    describedBy: string,
  ): string {
    return `<div class="choices rating" id="${id}" role="group" aria-labelledby="${id}-label">${[
      1, 2, 3, 4, 5,
    ]
      .map(
        (value, optionIndex) =>
          `<label class="choice"><input type="radio" name="${this.escapeHtml(field.name)}" value="${value}"${field.isRequired && optionIndex === 0 ? ' required' : ''}${describedBy} /><span>${value}</span></label>`,
      )
      .join('')}</div>`;
  }

  private numericAttribute(name: string, value: unknown): string {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? ` ${name}="${numericValue}"` : '';
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private safeJson(value: unknown): string {
    return JSON.stringify(value)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }
}
