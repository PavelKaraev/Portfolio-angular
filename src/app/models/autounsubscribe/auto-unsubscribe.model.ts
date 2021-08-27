/* tslint:disable:variable-name no-unused-expression */
import {Directive, OnDestroy, OnInit} from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Do not use this class without AutoUnsubscribe decorator if you don't have special necessaries
 * in some cases ivy incorrectly override component ɵfac factory on compile time and it will fail in runtime
 * when component try to use their own ɵfac property
 */
@Directive()
// tslint:disable-next-line:directive-class-suffix
export class BaseAutoUnsubscribeClassUndecorated<T = string> implements OnInit, OnDestroy {
    public cancellableSubject$: Subject<boolean> = new Subject<boolean>();
    /**
     * used for not to unsubscribe twice, don't use outside
     */
    private _alreadyUnsubscribedFromAllPossibleSubscriptions = false;

    public ngOnInit(): void {
        if (!this.cancellableSubject$ || this.cancellableSubject$.closed || this.cancellableSubject$.isStopped) {
            this.cancellableSubject$ = new Subject<boolean>();
        }
    }

    public ngOnDestroy(): void {
        if (this._alreadyUnsubscribedFromAllPossibleSubscriptions) {
            return;
        }

        !this.cancellableSubject$.closed && this.cancellableSubject$.next(true);
        this._alreadyUnsubscribedFromAllPossibleSubscriptions = true;
    }
}

@Directive()
export class BaseAutoUnsubscribeClass<T = string> extends BaseAutoUnsubscribeClassUndecorated<T> {}
