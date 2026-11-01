import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '@shared';
import { OrgBranchAccessComponent } from './org-branch-access.component';
import { OrgMembersComponent } from './org-members.component';
import { OrgService } from './org.service';
import { OrgStructureComponent } from './org-structure.component';

type Tab = 'structure' | 'members' | 'branch-access';

@Component({
  selector: 'app-org-screen',
  standalone: true,
  imports: [CommonModule, TranslatePipe, OrgStructureComponent, OrgMembersComponent, OrgBranchAccessComponent],
  templateUrl: './org-screen.component.html',
})
export class OrgScreenComponent implements OnInit {
  private service = inject(OrgService);

  readonly tab = signal<Tab>('structure');

  @Input()
  set apiBaseUrl(value: string) {
    this.service.setRuntimeOrigin(value);
  }

  ngOnInit(): void {
    // Child components load their own data.
  }

  selectTab(tab: Tab): void {
    this.tab.set(tab);
  }
}
