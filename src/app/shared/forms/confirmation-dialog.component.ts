import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nModule } from '../../i18n/i18n.module';
import { ConfirmationService } from './confirmation.service';

@Component({
  selector: 'app-confirmation-dialog', standalone: true, imports: [CommonModule, I18nModule],
  template: `<dialog #dialog class="discard-dialog" aria-labelledby="discard-title" aria-describedby="discard-description" (cancel)="cancel($event)">
    <h2 id="discard-title">{{ 'Unsaved changes' | t }}</h2>
    <p id="discard-description">{{ message | t }}</p>
    <div class="discard-actions">
      <button type="button" autofocus (click)="confirmation.resolve(false)">{{ 'Keep editing' | t }}</button>
      <button type="button" class="discard-button" (click)="confirmation.resolve(true)">{{ 'Discard changes' | t }}</button>
    </div>
  </dialog>`,
  styles: [`.discard-dialog{width:min(440px,calc(100vw - 32px));border:0;border-radius:16px;padding:28px;color:#293127;box-shadow:0 24px 80px #18311d33}.discard-dialog::backdrop{background:#14231888}h2{font-size:20px;font-weight:600}p{font-size:14px;line-height:1.6;color:#70786d;margin:16px 0 24px}.discard-actions{display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap}button{padding:10px 15px;border:1px solid #dfe5dc;border-radius:8px;font-size:13px}.discard-button{background:#9b4f32;color:white;border-color:#9b4f32}button:focus-visible{outline:2px solid #2e7d32;outline-offset:3px}`]
})
export class ConfirmationDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  message: string | null = null;
  private subscription?: Subscription;
  constructor(public confirmation: ConfirmationService, private changeDetector: ChangeDetectorRef) {}
  ngAfterViewInit() {
    this.subscription = this.confirmation.message$.subscribe(message => {
      this.message = message;
      if (message) {
        this.changeDetector.detectChanges();
        if (!this.dialog.nativeElement.open) this.dialog.nativeElement.showModal();
      } else if (this.dialog.nativeElement.open) this.dialog.nativeElement.close();
    });
  }
  cancel(event: Event) { event.preventDefault(); this.confirmation.resolve(false); }
  ngOnDestroy() { this.subscription?.unsubscribe(); this.confirmation.resolve(false); }
}
