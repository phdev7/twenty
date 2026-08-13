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

type RenderUnavailableFormInput = {
  marketingUrl: string;
  nonce: string;
};

@Injectable()
export class DiexFormsPublicRendererService {
  renderUnavailable({
    marketingUrl,
    nonce,
  }: RenderUnavailableFormInput): string {
    const safeMarketingUrl = this.escapeHtml(marketingUrl);

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <meta name="referrer" content="no-referrer" />
  <title>Formulário indisponível</title>
  <style nonce="${nonce}">
    :root { color-scheme: light dark; --background: #f4f4f5; --card: #ffffff; --foreground: #18181b; --muted-foreground: #71717a; --border: #e4e4e7; --secondary: #f4f4f5; --primary: #18181b; --primary-foreground: #fafafa; --ring: rgba(24,24,27,.18); }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body { margin: 0; color: var(--foreground); font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--background); }
    .page { min-height: 100dvh; display: grid; place-items: center; padding: max(24px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
    .card { width: min(100%, 560px); padding: 32px; border: 1px solid var(--border); border-radius: 12px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,.04); }
    .status-icon { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 8px; background: var(--secondary); color: var(--foreground); }
    .status-icon svg { width: 19px; height: 19px; }
    h1 { margin: 24px 0 0; font-size: 24px; font-weight: 600; line-height: 1.25; letter-spacing: -.025em; }
    .copy { margin: 10px 0 0; color: var(--muted-foreground); font-size: 14px; line-height: 1.55; }
    .actions { margin-top: 24px; display: flex; }
    .button { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; padding: 0 16px; background: var(--primary); color: var(--primary-foreground); font-size: 14px; font-weight: 500; text-decoration: none; transition: opacity .15s ease; }
    .button:hover { opacity: .9; }
    .button:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
    .note { margin: 24px 0 0; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted-foreground); font-size: 12px; line-height: 1.5; }
    @media (prefers-color-scheme: dark) { :root { --background: #09090b; --card: #18181b; --foreground: #fafafa; --muted-foreground: #a1a1aa; --border: #27272a; --secondary: #27272a; --primary: #fafafa; --primary-foreground: #18181b; --ring: rgba(250,250,250,.2); } }
    @media (max-width: 520px) { .page { align-items: start; padding-top: 20px; } .card { padding: 24px; } .actions, .button { width: 100%; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="card" aria-labelledby="state-title">
      <div class="status-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
      </div>
      <h1 id="state-title">Formulário indisponível</h1>
      <p class="copy">Este link pode estar incorreto, expirado ou ainda não ter sido publicado. Confirme o endereço recebido e tente novamente.</p>
      <div class="actions">
        <a class="button" href="${safeMarketingUrl}">Voltar ao site</a>
      </div>
      <p class="note">Nenhuma informação foi enviada.</p>
    </section>
  </main>
</body>
</html>`;
  }

  render({
    snapshot,
    token,
    submitUrl,
    workspaceName,
    workspaceLogoUrl,
    nonce,
  }: RenderPublicFormInput): string {
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
    const brand =
      snapshot.showLogo && logoUrl
        ? `<div class="brand"><img class="brand-logo" src="${this.escapeHtml(logoUrl)}" alt="${this.escapeHtml(workspaceName ?? snapshot.title)}" referrerpolicy="no-referrer" /></div>`
        : '';
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
      ? `<span>Envio seguro</span><a class="privacy-link" href="${this.escapeHtml(snapshot.privacyPolicyUrl)}" target="_blank" rel="noopener noreferrer">Política de privacidade</a>`
      : '<span>Envio seguro</span>';

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <meta name="referrer" content="no-referrer" />
  <title>${this.escapeHtml(snapshot.title)}</title>
  <style nonce="${nonce}">
    :root { color-scheme: light dark; --background: #f4f4f5; --card: #ffffff; --foreground: #18181b; --muted-foreground: #71717a; --border: #e4e4e7; --input: #d4d4d8; --secondary: #f4f4f5; --secondary-foreground: #3f3f46; --primary: #18181b; --primary-foreground: #fafafa; --ring: rgba(24,24,27,.18); --destructive: #b91c1c; --destructive-background: #fef2f2; --success: #166534; }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body { margin: 0; color: var(--foreground); font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--background); }
    button, input, textarea, select { font: inherit; }
    .page { min-height: 100dvh; padding: max(32px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(32px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); display: grid; place-items: center; }
    .shell { width: min(100%, 640px); }
    .brand { margin: 0 0 16px; display: flex; align-items: center; }
    .brand-logo { display: block; max-width: 160px; max-height: 44px; object-fit: contain; object-position: left center; }
    .card { overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,.04); }
    .progress-track { height: 3px; background: var(--secondary); }
    .progress-value { height: 100%; width: 0; background: var(--foreground); transition: width .2s ease; }
    .content { padding: 32px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; line-height: 1.25; letter-spacing: -.025em; }
    .intro-copy { margin: 8px 0 0; color: var(--muted-foreground); font-size: 14px; line-height: 1.55; }
    .question-list { margin-top: 32px; }
    .question { display: none; }
    .question.is-visible, .single-page .question { display: block; }
    .single-page .question + .question { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
    .question-index { display: inline-flex; margin-bottom: 8px; color: var(--muted-foreground); font-size: 12px; font-weight: 500; }
    .question-label { display: block; margin: 0 0 7px; font-size: 14px; font-weight: 500; line-height: 1.45; }
    .required { color: var(--destructive); }
    .help { margin: -1px 0 10px; color: var(--muted-foreground); font-size: 12px; line-height: 1.5; }
    .control { width: 100%; min-height: 40px; border: 1px solid var(--input); border-radius: 6px; outline: none; background: var(--card); color: var(--foreground); padding: 9px 12px; font-size: 14px; transition: border-color .15s ease, box-shadow .15s ease; }
    .control::placeholder { color: var(--muted-foreground); opacity: .75; }
    .control:focus { border-color: var(--foreground); box-shadow: 0 0 0 3px var(--ring); }
    textarea.control { min-height: 112px; resize: vertical; line-height: 1.5; }
    .choices { display: grid; gap: 8px; }
    .choice { position: relative; display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 9px 12px; border: 1px solid var(--input); border-radius: 6px; background: var(--card); cursor: pointer; font-size: 14px; transition: border-color .15s ease, background .15s ease; }
    .choice:hover { border-color: var(--foreground); }
    .choice:has(input:checked) { border-color: var(--foreground); background: var(--secondary); }
    .choice:focus-within { box-shadow: 0 0 0 3px var(--ring); }
    .choice input { width: 16px; height: 16px; margin: 0; accent-color: var(--foreground); }
    .rating { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .rating .choice { justify-content: center; padding: 9px 4px; }
    .rating .choice input { position: absolute; opacity: 0; pointer-events: none; }
    .actions { margin-top: 24px; display: flex; align-items: center; gap: 8px; }
    .button { min-height: 40px; border: 1px solid transparent; border-radius: 6px; padding: 0 16px; cursor: pointer; font-size: 14px; font-weight: 500; transition: opacity .15s ease, background .15s ease; }
    .button:hover { opacity: .9; }
    .button:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
    .button:disabled { cursor: wait; opacity: .55; }
    .button-primary { margin-left: auto; background: var(--primary); color: var(--primary-foreground); }
    .button-secondary { border-color: var(--border); background: var(--card); color: var(--secondary-foreground); }
    .step-count { color: var(--muted-foreground); font-size: 12px; font-variant-numeric: tabular-nums; }
    .consent { display: flex; gap: 10px; margin-top: 24px; color: var(--muted-foreground); font-size: 12px; line-height: 1.5; }
    .consent input { width: 16px; height: 16px; flex: 0 0 auto; margin-top: 1px; accent-color: var(--foreground); }
    .form-footer { min-height: 20px; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; color: var(--muted-foreground); font-size: 11px; }
    .privacy-link { color: inherit; text-underline-offset: 3px; }
    .hp { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0,0,0,0) !important; white-space: nowrap !important; }
    .error { min-height: 18px; margin-top: 12px; color: var(--destructive); font-size: 12px; line-height: 1.45; }
    .error:not(:empty) { padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--destructive) 22%, var(--border)); border-radius: 6px; background: var(--destructive-background); }
    .success { display: none; padding: 48px 32px; text-align: center; outline: none; }
    .success.is-visible { display: block; }
    .success-icon { width: 42px; height: 42px; margin: 0 auto 20px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 8px; background: var(--secondary); color: var(--foreground); }
    .success-icon svg { width: 20px; height: 20px; }
    .success-eyebrow { margin: 0 0 8px; color: var(--muted-foreground); font-size: 12px; font-weight: 500; }
    .success h2 { margin: 0; font-size: 24px; font-weight: 600; line-height: 1.3; letter-spacing: -.025em; }
    .success p { margin: 8px auto 0; max-width: 460px; color: var(--muted-foreground); font-size: 14px; line-height: 1.55; }
    .success-receipt { max-width: 400px; margin: 24px auto 0; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--secondary); text-align: left; }
    .success-dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--success); }
    .success-receipt strong, .success-receipt span { display: block; }
    .success-receipt strong { font-size: 13px; font-weight: 500; }
    .success-receipt span { margin-top: 2px; color: var(--muted-foreground); font-size: 11px; line-height: 1.4; }
    .success-close { padding-top: 14px; font-size: 11px !important; }
    @media (prefers-color-scheme: dark) { :root { --background: #09090b; --card: #18181b; --foreground: #fafafa; --muted-foreground: #a1a1aa; --border: #27272a; --input: #3f3f46; --secondary: #27272a; --secondary-foreground: #e4e4e7; --primary: #fafafa; --primary-foreground: #18181b; --ring: rgba(250,250,250,.2); --destructive: #fca5a5; --destructive-background: #2b1618; --success: #86efac; } }
    @media (max-width: 520px) { .page { align-items: start; padding-top: 16px; } .content, .success { padding: 24px; } .actions { flex-wrap: wrap; } .step-count { order: 3; width: 100%; text-align: right; } .rating { gap: 6px; } }
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
          <footer class="form-footer">${privacy}</footer>
        </div>
        <div class="success" id="success" role="status" aria-live="polite" tabindex="-1">
          <div class="success-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg></div>
          <p class="success-eyebrow">Envio confirmado</p>
          <h2>${this.escapeHtml(snapshot.successTitle)}</h2>
          <p>${this.escapeHtml(snapshot.successMessage)}</p>
          <div class="success-receipt"><span class="success-dot" aria-hidden="true"></span><div><strong>Informações recebidas</strong><span>Os dados foram registrados com segurança.</span></div></div>
          <p class="success-close">Você já pode fechar esta página.</p>
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
      const success = document.getElementById('success');
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
        form.setAttribute('aria-busy', 'true');
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
          form.setAttribute('aria-busy', 'false');
          document.getElementById('form-content').hidden = true;
          success.classList.add('is-visible');
          progress.style.width = '100%';
          document.title = ${this.safeJson(`Envio confirmado | ${snapshot.title}`)};
          success.focus();
        } catch (caught) {
          form.setAttribute('aria-busy', 'false');
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
