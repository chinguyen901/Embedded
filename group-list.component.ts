// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-group-list',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="page-container">
//       <h2>Groups</h2>
//       <div class="card">
//         <div class="card-body">
//           <p>Groups page test - to be implemented</p>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class GroupListComponent {}

import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SoapService } from '../../services/soap.service';
import { ConfigurationService } from '../../services/configuration.service';
import { GlobalService } from '../../services/global.service';
import { UtilitiesService } from '../../services/utilities.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css'],
})
export class GroupListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  groupData: any[] = [];
  tenantData: any[] = [];
  selectedRows: number[] = [];
  selected = 0;
  orderByField = 'name';
  reverseSort = false;
  is_mt_enable = false;

  constructor(
    private router: Router,
    private soapUtils: SoapService,
    private configuration: ConfigurationService,
    private globalVariable: GlobalService,
    private utilities: UtilitiesService
  ) {}

  ngOnInit(): void {
    this.globalVariable.is_mt_enable$.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      this.is_mt_enable = val;
    });

    this.init();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  init(): void {
    // Thiết lập trạng thái UI / Navigation
    this.configuration.setActivePage('FEATURE_CONFIGURATION', 'CONFIGURATION_MENU_GROUPSANDUSERS', 'CONFIGURATION_GROUPSANDUSERS_GROUPS');

    this.is_mt_enable = this.globalVariable.is_mt_enable;
    this.configuration.history = [{ ui: 'configuration.groups', name: 'Groups' }];
    this.selected = 0;
    this.getGroupList();
  }

  setClickedRow(index: number): void {
    this.selectedRows = this.utilities.getSelectedRows(this.selectedRows, index);

    this.groupData.forEach((g) => (g.selected = false));
    this.selectedRows.forEach((i) => {
      this.groupData[i].selected = true;
    });

    this.selected = this.selectedRows.length;
  }

  addGroup(): void {
    this.router.navigate(['/configuration/groups/add_group/general']);
    this.configuration.group.update++;
    this.configuration.group.name = '';
    this.configuration.group.status = 'Create';
  }

  modifyGroup(): void {
    if (this.selected === 1) {
      const idx = this.groupData.findIndex((g) => g.selected);
      if (idx !== -1) this.edit(idx);
    }
  }

  copyGroup(): void {
    if (this.selected === 1) {
      const idx = this.groupData.findIndex((g) => g.selected);
      if (idx !== -1) this.copy(idx);
    }
  }

  deleteGroup(): void {
    this.utilities.displayConfirmDialog(
      'Confirm',
      'Delete selected groups?',
      1,
      () => this.confirmOK(),
      () => this.confirmCancel()
    );
  }

  confirmOK(): void {
    this.deleteGroup_ok();
  }

  confirmCancel(): void {
    // no-op
  }

  deleteGroup_ok(): void {
    let xml = '<Sip><config><userGroupList>';
    for (const g of this.groupData) {
      if (g.selected) {
        g.selected = false;
        xml += `<userGroup><name>${g.name}</name></userGroup>`;
      }
    }
    xml += '</userGroupList></config></Sip>';

    this.soapUtils.executeDelete(xml).then(
      (data: any) => {
        if (data.Envelope?.Body?.Fault) {
          this.utilities.displaySingleErrorDialog(data.Envelope.Body.Fault.faultstring);
          return;
        }
        this.init();
      },
      () => this.init()
    );
  }

  getGroupList(): void {
    const xml =
      '<readSip><config><userGroupList><userGroup/></userGroupList><tenantList><tenant/></tenantList></config></readSip>';

    this.soapUtils.executeRead(xml).then(
      (data: any) => {
        const res = data.Envelope.Body.readResponse.out;
        const groupList = res.Sip.config.userGroupList;
        const tenantList = res.Sip.config.tenantList;

        const groupDataProvider: any[] = [];
        const tenantDataProvider: any[] = [];

        // ---- PARSE GROUPS ----
        const groups = Array.isArray(groupList.userGroup)
          ? groupList.userGroup
          : [groupList.userGroup];

        groups.forEach((group: any) => {
          if (group.isLocalGroup === '0' && group.authDirectory !== '__AAA__') {
            group.localGroups = group.authDirectory;
          } else if (!group.ldapGroupList?.ldapGroup?.length) {
            group.localGroups = 'N/A';
          } else {
            const list = Array.isArray(group.ldapGroupList.ldapGroup)
              ? group.ldapGroupList.ldapGroup
              : [group.ldapGroupList.ldapGroup];
            const names = list.slice(0, 3).map((x: any) => x.name?.toString());
            group.localGroups = names.join(', ') + (list.length > 3 ? ', ...' : '');
            this.configuration.group.data.original_assigned_groups.push({
              group_name: group.name,
              data: list,
            });
          }
          groupDataProvider.push(group);
        });

        // ---- PARSE TENANTS ----
        const tenants = Array.isArray(tenantList.tenant)
          ? tenantList.tenant
          : [tenantList.tenant];

        this.configuration.group.data.tenant_list = tenants;
        tenantDataProvider.push(...tenants);

        // ---- MAP tenant name ----
        for (const g of groupDataProvider) {
          const foundTenant = tenantDataProvider.find((t) => t.tid === g.tenantTid);
          if (foundTenant) g.tenant = foundTenant.name;
        }

        this.groupData = groupDataProvider;

        // apply colResizable nếu có
        (window as any).applyColResizable?.('group_list_table');
      },
      (error: any) => {
        console.error('Error: ', error.statusText);
      }
    );
  }

  sort(field: string): void {
    this.orderByField = field;
    this.reverseSort = !this.reverseSort;
    const reverse = this.reverseSort ? 1 : -1;

    this.groupData.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      return reverse * ((valA > valB ? 1 : 0) - (valA < valB ? 1 : 0));
    });

    this.selectedRows = [];
    this.groupData.forEach((g, i) => {
      if (g.selected) this.selectedRows.push(i);
    });
  }

  edit(index: number): void {
    const group = this.groupData[index];
    this.router.navigate(['/configuration/groups/add_group/general']);
    this.configuration.group.name = group.name;
    this.configuration.group.need_update = true;
    this.configuration.group.status = 'Modify';
    this.configuration.group.update++;
  }

  copy(index: number): void {
    const group = this.groupData[index];
    this.router.navigate(['/configuration/groups/add_group/general']);
    this.configuration.group.name = group.name;
    this.configuration.group.need_update = true;
    this.configuration.group.status = 'Copy';
    this.configuration.group.update++;
  }
}
