import {NgModule, ModuleWithProviders, Provider} from '@angular/core';
import {TranslateLoader, LocalTranslateLoader} from './translate.loader';
import {MissingTranslationHandler, FakeMissingTranslationHandler} from './missing-translation-handler';
import {TranslateParser, TranslateDefaultParser} from './translate.parser';
import {TranslateCompiler, TranslateFakeCompiler} from './translate.compiler';
import {TranslateDirective} from './translate.directive';
import {TranslatePipe} from './translate.pipe';
import {TranslateStore} from './translate.store';
import {USE_DEFAULT_LANG, DEFAULT_LANGUAGE, USE_STORE, TranslateService, USE_EXTEND} from './translate.service';

export * from './translate.loader';
export * from './translate.service';
export * from './missing-translation-handler';
export * from './translate.parser';
export * from './translate.compiler';
export * from './translate.directive';
export * from './translate.pipe';
export * from './translate.store';

export interface TranslateModuleConfig {
  loader?: Provider;
  compiler?: Provider;
  parser?: Provider;
  missingTranslationHandler?: Provider;
  // isolate the service instance, only works for lazy loaded modules or components with the "providers" property
  isolate?: boolean;
  // extends translations for a given language instead of ignoring them if present
  extend?: boolean;
  useDefaultLang?: boolean;
  defaultLanguage?: string;
}

@NgModule({
  declarations: [
    TranslatePipe,
    TranslateDirective
  ],
  exports: [
    TranslatePipe,
    TranslateDirective
  ]
})
export class TranslateModule {
  /**
   * Use this method in your root module to provide the TranslateService
   */
  static forRoot(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        config.loader || {provide: TranslateLoader, useClass: LocalTranslateLoader},
        config.compiler || {provide: TranslateCompiler, useClass: TranslateFakeCompiler},
        config.parser || {provide: TranslateParser, useClass: TranslateDefaultParser},
        config.missingTranslationHandler || {provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler},
        TranslateStore,
        {provide: USE_STORE, useValue: config.isolate},
        {provide: USE_DEFAULT_LANG, useValue: config.useDefaultLang},
        {provide: USE_EXTEND, useValue: config.extend},
        {provide: DEFAULT_LANGUAGE, useValue: config.defaultLanguage},
        TranslateService
      ]
    };
  }

  /**
   * Use this method in your other (non root) modules to import the directive/pipe
   */
  static forChild(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        config.loader || {provide: TranslateLoader, useClass: LocalTranslateLoader},
        config.compiler || {provide: TranslateCompiler, useClass: TranslateFakeCompiler},
        config.parser || {provide: TranslateParser, useClass: TranslateDefaultParser},
        config.missingTranslationHandler || {provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler},
        {provide: USE_STORE, useValue: config.isolate},
        {provide: USE_DEFAULT_LANG, useValue: config.useDefaultLang},
        {provide: USE_EXTEND, useValue: config.extend},
        {provide: DEFAULT_LANGUAGE, useValue: config.defaultLanguage},
        TranslateService
      ]
    };
  }
}
