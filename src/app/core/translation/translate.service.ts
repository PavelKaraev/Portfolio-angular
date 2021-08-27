import {EventEmitter, Inject, Injectable, InjectionToken, OnDestroy} from '@angular/core';
import {concat, forkJoin, isObservable, Observable, of, defer, Subject} from 'rxjs';
import {concatMap, map, shareReplay, switchMap, take, takeUntil} from 'rxjs/operators';
import {MissingTranslationHandler, MissingTranslationHandlerParams} from './missing-translation-handler';
import {TranslateCompiler} from './translate.compiler';
import {TranslateLoader} from './translate.loader';
import {TranslateParser} from './translate.parser';

import {TranslateStore} from './translate.store';
import {isDefined, mergeDeep} from './util';

export const USE_STORE = new InjectionToken<string>('USE_STORE');
export const USE_DEFAULT_LANG = new InjectionToken<string>('USE_DEFAULT_LANG');
export const DEFAULT_LANGUAGE = new InjectionToken<string>('DEFAULT_LANGUAGE');
export const USE_EXTEND = new InjectionToken<string>('USE_EXTEND');

export interface TranslationChangeEvent {
  translations: any;
  lang: string;
}

export interface LangChangeEvent {
  lang: string;
  translations: any;
}

export interface DefaultLangChangeEvent {
  lang: string;
  translations: any;
}

declare interface Window {
  navigator: any;
}

declare const window: Window;

@Injectable()
export class TranslateService implements OnDestroy {
  public takeUntil$: Subject<boolean> = new Subject<boolean>();
  private loadingTranslations: Observable<any>;
  private pending = false;
  private _onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();
  private _onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();
  private _onDefaultLangChange: EventEmitter<DefaultLangChangeEvent> = new EventEmitter<DefaultLangChangeEvent>();
  private _defaultLang: string;
  private _currentLang: string;
  private _langs: Array<string> = [];
  private _translations: any = {};
  private _translationRequests: any = {};

  get onTranslationChange(): EventEmitter<TranslationChangeEvent> {
    return this.isolate ? this._onTranslationChange : this.store.onTranslationChange;
  }

  get onLangChange(): EventEmitter<LangChangeEvent> {
    return this.isolate ? this._onLangChange : this.store.onLangChange;
  }

  get onDefaultLangChange() {
    return this.isolate ? this._onDefaultLangChange : this.store.onDefaultLangChange;
  }

  get defaultLang(): string {
    return this.isolate ? this._defaultLang : this.store.defaultLang;
  }

  set defaultLang(defaultLang: string) {
    if (this.isolate) {
      this._defaultLang = defaultLang;
    } else {
      this.store.defaultLang = defaultLang;
    }
  }

  get currentLang(): string {
    return this.isolate ? this._currentLang : this.store.currentLang;
  }

  set currentLang(currentLang: string) {
    if (this.isolate) {
      this._currentLang = currentLang;
    } else {
      this.store.currentLang = currentLang;
    }
  }

  /**
   * an array of langs
   */
  get langs(): string[] {
    return this.isolate ? this._langs : this.store.langs;
  }

  set langs(langs: string[]) {
    if (this.isolate) {
      this._langs = langs;
    } else {
      this.store.langs = langs;
    }
  }

  /**
   * a list of translations per lang
   */
  get translations(): any {
    return this.isolate ? this._translations : this.store.translations;
  }

  set translations(translations: any) {
    if (this.isolate) {
      this._translations = translations;
    } else {
      this.store.translations = translations;
    }
  }

  constructor(public store: TranslateStore,
              public currentLoader: TranslateLoader,
              public compiler: TranslateCompiler,
              public parser: TranslateParser,
              public missingTranslationHandler: MissingTranslationHandler,
              @Inject(USE_DEFAULT_LANG) private useDefaultLang: boolean = true,
              @Inject(USE_STORE) private isolate: boolean = false,
              @Inject(USE_EXTEND) private extend: boolean = false,
              @Inject(DEFAULT_LANGUAGE) defaultLanguage: string) {
    /** set the default language from configuration */
    if (defaultLanguage) {
      this.setDefaultLang(defaultLanguage);
    }
  }

  ngOnDestroy(): void {
    this.takeUntil$.next(true);
    this.takeUntil$.complete();
  }

  public setDefaultLang(lang: string): void {
    if (lang === this.defaultLang) {
      return;
    }

    const pending: Observable<any> = this.retrieveTranslations(lang);

    if (typeof pending !== 'undefined') {
      // on init set the defaultLang immediately
      if (this.defaultLang == null) {
        this.defaultLang = lang;
      }

      pending.pipe(take(1))
        .subscribe((res: any) => {
          this.changeDefaultLang(lang);
        });
    } else { // we already have this language
      this.changeDefaultLang(lang);
    }
  }

  public getDefaultLang(): string {
    return this.defaultLang;
  }

  public use(lang: string): Observable<any> {
    // don't change the language if the language given is already selected
    if (lang === this.currentLang) {
      return of(this.translations[lang]);
    }

    const pending: Observable<any> = this.retrieveTranslations(lang);

    if (typeof pending !== 'undefined') {
      // on init set the currentLang immediately
      if (!this.currentLang) {
        this.currentLang = lang;
      }

      pending.pipe(take(1))
        .subscribe((res: any) => {
          this.changeLang(lang);
        });

      return pending;
    } else { // we have this language, return an Observable
      this.changeLang(lang);

      return of(this.translations[lang]);
    }
  }

  private retrieveTranslations(lang: string): Observable<any> {
    let pending: Observable<any>;

    // if this language is unavailable or extend is true, ask for it
    if (typeof this.translations[lang] === 'undefined' || this.extend) {
      this._translationRequests[lang] = this._translationRequests[lang] || this.getTranslation(lang);
      pending = this._translationRequests[lang];
    }

    return pending;
  }

  public getTranslation(lang: string): Observable<any> {
    this.pending = true;
    const loadingTranslations = this.currentLoader.getTranslation(lang).pipe(
      shareReplay(1),
      take(1),
    );

    this.loadingTranslations = loadingTranslations.pipe(
      map((res: any) => this.compiler.compileTranslations(res, lang)),
      shareReplay(1),
      take(1),
    );

    this.loadingTranslations
      .pipe(
        takeUntil(this.takeUntil$)
      )
      .subscribe({
        next: (res: any) => {
          this.translations[lang] = this.extend && this.translations[lang] ? {...res, ...this.translations[lang]} : res;
          this.updateLangs();
          this.pending = false;
        },
        error: (err: any) => {
          this.pending = false;
        }
      });

    return loadingTranslations;
  }

  /**
   * Manually sets an object of translations for a given language
   * after passing it through the compiler
   */
  public setTranslation(lang: string, translations: any, shouldMerge: boolean = false): void {
    translations = this.compiler.compileTranslations(translations, lang);
    if ((shouldMerge || this.extend) && this.translations[lang]) {
      this.translations[lang] = mergeDeep(this.translations[lang], translations);
    } else {
      this.translations[lang] = translations;
    }
    this.updateLangs();
    this.onTranslationChange.emit({lang, translations: this.translations[lang]});
  }

  /**
   * Returns an array of currently available langs
   */
  public getLangs(): Array<string> {
    return this.langs;
  }

  /**
   * Add available langs
   */
  public addLangs(langs: Array<string>): void {
    langs.forEach((lang: string) => {
      if (this.langs.indexOf(lang) === -1) {
        this.langs.push(lang);
      }
    });
  }

  /**
   * Update the list of available langs
   */
  private updateLangs(): void {
    this.addLangs(Object.keys(this.translations));
  }

  /**
   * Returns the parsed result of the translations
   */
  public getParsedResult(translations: any, key: any, interpolateParams?: any): any {
    let res: string | Observable<string>;

    if (key instanceof Array) {
      const result: any = {};
      let observables = false;

      for (const k of key) {
        result[k] = this.getParsedResult(translations, k, interpolateParams);
        if (isObservable(result[k])) {
          observables = true;
        }
      }
      if (observables) {
        const sources = key.map(k => isObservable(result[k]) ? result[k] : of(result[k] as string));
        return forkJoin(sources).pipe(
          map((arr: Array<string>) => {
            const obj: any = {};
            arr.forEach((value: string, index: number) => {
              obj[key[index]] = value;
            });
            return obj;
          })
        );
      }
      return result;
    }

    if (translations) {
      res = this.parser.interpolate(this.parser.getValue(translations, key), interpolateParams);
    }

    if (typeof res === 'undefined' && this.defaultLang != null && this.defaultLang !== this.currentLang && this.useDefaultLang) {
      res = this.parser.interpolate(this.parser.getValue(this.translations[this.defaultLang], key), interpolateParams);
    }

    if (typeof res === 'undefined') {
      const params: MissingTranslationHandlerParams = {key, translateService: this};
      if (typeof interpolateParams !== 'undefined') {
        params.interpolateParams = interpolateParams;
      }
      res = this.missingTranslationHandler.handle(params);
    }

    return typeof res !== 'undefined' ? res : key;
  }

  /**
   * Gets the translated value of a key (or an array of keys)
   * @returns the translated key, or an object of translated keys
   */
  public get(key: string | Array<string>, interpolateParams?: any): Observable<string | any> {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" required`);
    }
    // check if we are loading a new translation to use
    if (this.pending) {
      return this.loadingTranslations.pipe(
        concatMap((res: any) => {
          res = this.getParsedResult(res, key, interpolateParams);
          return isObservable(res) ? res : of(res);
        }),
      );
    } else {
      const res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
      return isObservable(res) ? res : of(res);
    }
  }

  /**
   * Returns a stream of translated values of a key (or an array of keys) which updates
   * whenever the translation changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public getStreamOnTranslationChange(key: string | Array<string>, interpolateParams?: any): Observable<string | any> {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" required`);
    }

    return concat(
      defer(() => this.get(key, interpolateParams)),
      this.onTranslationChange.pipe(
        switchMap((event: TranslationChangeEvent) => {
          const res = this.getParsedResult(event.translations, key, interpolateParams);
          if (typeof res.subscribe === 'function') {
            return res;
          } else {
            return of(res);
          }
        })
      )
    );
  }

  /**
   * Returns a stream of translated values of a key (or an array of keys) which updates
   * whenever the language changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public stream(key: string | Array<string>, interpolateParams?: any): Observable<string | any> {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" required`);
    }

    return concat(
      defer(() => this.get(key, interpolateParams)),
      this.onLangChange.pipe(
        switchMap((event: LangChangeEvent) => {
          const res = this.getParsedResult(event.translations, key, interpolateParams);
          return isObservable(res) ? res : of(res);
        })
      ));
  }

  /**
   * Returns a translation instantly from the internal state of loaded translation.
   * All rules regarding the current language, the preferred language of even fallback languages will be used except any promise handling.
   */
  public instant(key: string | Array<string>, interpolateParams?: any): string | any {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" required`);
    }

    const res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
    if (isObservable(res)) {
      if (key instanceof Array) {
        const obj: any = {};
        key.forEach((value: string, index: number) => {
          obj[key[index]] = key[index];
        });
        return obj;
      }
      return key;
    } else {
      return res;
    }
  }

  /**
   * Sets the translated value of a key, after compiling it
   */
  public set(key: string, value: string, lang: string = this.currentLang): void {
    this.translations[lang][key] = this.compiler.compile(value, lang);
    this.updateLangs();
    this.onTranslationChange.emit({lang, translations: this.translations[lang]});
  }

  /**
   * Changes the current lang
   */
  private changeLang(lang: string): void {
    this.currentLang = lang;
    this.onLangChange.emit({lang, translations: this.translations[lang]});

    // if there is no default lang, use the one that we just set
    if (this.defaultLang == null) {
      this.changeDefaultLang(lang);
    }
  }

  /**
   * Changes the default lang
   */
  private changeDefaultLang(lang: string): void {
    this.defaultLang = lang;
    this.onDefaultLangChange.emit({lang, translations: this.translations[lang]});
  }

  /**
   * Allows to reload the lang file from the file
   */
  public reloadLang(lang: string): Observable<any> {
    this.resetLang(lang);
    return this.getTranslation(lang);
  }

  /**
   * Deletes inner translation
   */
  public resetLang(lang: string): void {
    this._translationRequests[lang] = undefined;
    this.translations[lang] = undefined;
  }

  /**
   * Returns the language code name from the browser, e.g. "de"
   */
  public getBrowserLang(): string {
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
      return undefined;
    }

    let browserLang: any = window.navigator.languages ? window.navigator.languages[0] : null;
    browserLang = browserLang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;

    if (typeof browserLang === 'undefined') {
      return undefined;
    }

    if (browserLang.indexOf('-') !== -1) {
      browserLang = browserLang.split('-')[0];
    }

    if (browserLang.indexOf('_') !== -1) {
      browserLang = browserLang.split('_')[0];
    }

    return browserLang;
  }

  /**
   * Returns the culture language code name from the browser, e.g. "de-DE"
   */
  public getBrowserCultureLang(): string {
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
      return undefined;
    }

    let browserCultureLang: any = window.navigator.languages ? window.navigator.languages[0] : null;
    browserCultureLang = browserCultureLang
      || window.navigator.language
      || window.navigator.browserLanguage
      || window.navigator.userLanguage;

    return browserCultureLang;
  }
}
