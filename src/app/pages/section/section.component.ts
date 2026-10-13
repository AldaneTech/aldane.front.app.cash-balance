import { I18nModule } from '../../i18n/i18n.module';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-section',
  standalone: true,
  template: `
    <section class="mx-auto max-w-7xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
      <h1 class="text-2xl font-bold text-brand-secondary">{{ title | t }}</h1>
    </section>
  `
})
export class SectionComponent {
  readonly title: string;
  constructor(route: ActivatedRoute) {
    this.title = route.snapshot.data['title'] as string;
  }
}
