import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {
  PluginHostScreen,
  PluginHostService,
  PluginWebComponentLoaderComponent,
  TranslatePipe,
} from '@shared';
import { PluginContextService } from '../../../core/plugin-context.service';

@Component({
  selector: 'app-plugin-screen',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    TranslatePipe,
    PluginWebComponentLoaderComponent,
  ],
  templateUrl: './plugin-screen.page.html',
})
export class PluginScreenPage implements OnInit {
  private route = inject(ActivatedRoute);
  private host = inject(PluginHostService);
  pluginContext = inject(PluginContextService);

  readonly screen = signal<PluginHostScreen | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    const pluginKey = this.route.snapshot.paramMap.get('pluginKey') ?? '';
    await this.host.loadManifest();
    const screen = this.host.screens().find(
      (item) => item.plugin_key === pluginKey && (item.platforms ?? ['desktop']).includes('mobile')
    );
    this.screen.set(screen ?? null);
    this.failed.set(!screen);
    this.loading.set(false);
  }

  onNavigate(path: string): void {
    this.pluginContext.navigate(path);
  }

  retry(): void {
    void this.host.loadManifest(true).then(() => this.ngOnInit());
  }
}
