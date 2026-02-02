import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcher } from './language-switcher';
import { getTranslocoModule } from '../../testing/transloco-testing.module';
import { TranslocoService } from '@jsverse/transloco';

describe('LanguageSwitcher', () => {
  let component: LanguageSwitcher;
  let fixture: ComponentFixture<LanguageSwitcher>;
  let translocoService: TranslocoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher, getTranslocoModule()],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default language from localStorage or vi', () => {
    expect(component.selectedLanguage()).toBeTruthy();
    expect(['vi', 'en', 'es']).toContain(component.selectedLanguage());
  });

  it('should render sidebar mode correctly', () => {
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const sidebarMode = compiled.querySelector('#language-switcher-sidebar-mode');
    expect(sidebarMode).toBeTruthy();

    const viButton = compiled.querySelector('#language-switcher-vi-button');
    const enButton = compiled.querySelector('#language-switcher-en-button');
    expect(viButton).toBeTruthy();
    expect(enButton).toBeTruthy();
  });

  it('should render narrow mode correctly', () => {
    fixture.componentRef.setInput('mode', 'narrow');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const narrowMode = compiled.querySelector('#language-switcher-narrow-mode');
    expect(narrowMode).toBeTruthy();

    const narrowButton = compiled.querySelector('#language-switcher-narrow-button');
    expect(narrowButton).toBeTruthy();
  });

  it('should toggle between VI and EN in sidebar mode', () => {
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const initialLang = component.selectedLanguage();
    component.togglePrimaryLanguage();
    fixture.detectChanges();

    const newLang = component.selectedLanguage();
    expect(newLang).not.toBe(initialLang);
    expect(['vi', 'en']).toContain(newLang);
  });

  it('should emit change event when language is selected', (done) => {
    component.change.subscribe((code: string) => {
      expect(code).toBe('es');
      done();
    });

    component.selectLanguage('es');
  });

  it('should open and close all languages dialog', () => {
    expect(component.showAllLanguagesDialog()).toBe(false);

    component.openAllLanguagesDialog();
    expect(component.showAllLanguagesDialog()).toBe(true);

    component.closeAllLanguagesDialog();
    expect(component.showAllLanguagesDialog()).toBe(false);
  });

  it('should filter languages based on search query', () => {
    component.searchQuery.set('eng');
    fixture.detectChanges();

    const filtered = component.filteredLanguages();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some((lang) => lang.code === 'en')).toBe(true);
  });

  it('should have correct flag URL', () => {
    const flagUrl = component.getFlagUrl('VN');
    expect(flagUrl).toContain('VN');
    expect(flagUrl).toContain('flagsapi.com');
  });

  it('should update transloco service when language changes', () => {
    spyOn(translocoService, 'setActiveLang');

    component.selectLanguage('fr');
    fixture.detectChanges();

    expect(translocoService.setActiveLang).toHaveBeenCalledWith('fr');
  });

  it('should have all required elements with unique IDs', () => {
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('#language-switcher-container')).toBeTruthy();
    expect(compiled.querySelector('#language-switcher-sidebar-mode')).toBeTruthy();
    expect(compiled.querySelector('#language-switcher-vi-button')).toBeTruthy();
    expect(compiled.querySelector('#language-switcher-en-button')).toBeTruthy();
    expect(compiled.querySelector('#language-switcher-more-button')).toBeTruthy();
  });

  it('should persist language selection to localStorage', () => {
    spyOn(localStorage, 'setItem');

    component.selectLanguage('de');
    fixture.detectChanges();

    expect(localStorage.setItem).toHaveBeenCalledWith('app.lang', 'de');
  });

  it('should have proper accessibility attributes', () => {
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const viButton = compiled.querySelector('#language-switcher-vi-button');
    expect(viButton.getAttribute('aria-pressed')).toBeDefined();
    expect(viButton.getAttribute('aria-label')).toBeTruthy();
  });

  it('should include world languages in the list', () => {
    const langs = component.languages();
    expect(langs.length).toBeGreaterThan(5);
    expect(langs.some((lang) => lang.code === 'ja')).toBe(true);
    expect(langs.some((lang) => lang.code === 'zh')).toBe(true);
    expect(langs.some((lang) => lang.code === 'ko')).toBe(true);
  });
});
