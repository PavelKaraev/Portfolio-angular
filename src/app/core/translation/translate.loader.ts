import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

const translates = ((ctx) => {
  const keys = ctx.keys();
  const values = keys.map(ctx);

  const results: { [key: string]: any; } = {};

  for (let i = 0; i < keys.length; i++) {
    const value = values.length > i ? values[i] : null;

    results[keys[i]] = value;
  }

  return results;
})((require as any).context('../../../../translations/', true, /\.json/));


export abstract class TranslateLoader {
  abstract getTranslation(lang: string): Observable<any>;
}

/**
 * This loader is just a placeholder that does nothing, in case you don't need a loader at all
 */
@Injectable()
export class LocalTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(translates[`./${lang}.json`]);
  }
}
