// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-tenant-list',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="page-container">
//       <h2>Tenants</h2>
//       <div class="card">
//         <div class="card-body">
//           <p>Tenant list page - to be implemented</p>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class TenantListComponent {}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SoapService } from '../../services/soap.service';
import { ConfigurationService } from '../../services/configuration.service';

interface Tenant {
  tid: string;
  name: string;
  description: string;
  countryCode?: string;
  areaCodes?: string;
  mainNumber?: string;
  tdpOn?: string;
  extensionLength?: string;
  dpOperater?: string;
  dpDefaultTac?: string;
  selected?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-tenant-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.css']
})
export class TenantListComponent implements OnInit {
  tenantData: Tenant[] = [];
  selectedRows: number[] = [];
  selectedTenant: Tenant | null = null;
  orderByField: keyof Tenant = 'tid';
  reverseSort = false;
  selectedCount = 0;

  constructor(
    private soapService: SoapService,
    private configService: ConfigurationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.selectedRows = [];
    this.selectedTenant = null;
    this.selectedCount = 0;
    this.getData();
  }

  getData(): void {
    const xml = `<readSip><config><tenantList><tenant/></tenantList></config></readSip>`;
    this.soapService.executeRead(xml).then(res => {
      const tenants = res?.Envelope?.Body?.readResponse?.out?.Sip?.config?.tenantList?.tenant;
      this.tenantData = Array.isArray(tenants) ? tenants : tenants ? [tenants] : [];
      this.tenantData.forEach(t => t.selected = false);
    });
  }

  setClickedRow(index: number): void {
    const idx = this.selectedRows.indexOf(index);
    if (idx > -1) {
      this.selectedRows.splice(idx, 1);
    } else {
      this.selectedRows.push(index);
    }

    this.tenantData.forEach((t, i) => t.selected = this.selectedRows.includes(i));
    this.selectedCount = this.selectedRows.length;
    this.selectedTenant = this.selectedCount === 1 ? this.tenantData[this.selectedRows[0]] : null;
  }

  sort(field: keyof Tenant): void {
    if (this.orderByField === field) {
      this.reverseSort = !this.reverseSort;
    } else {
      this.orderByField = field;
      this.reverseSort = false;
    }

    const reverse = this.reverseSort ? -1 : 1;
    this.tenantData.sort((a, b) => {
      if (a[field] == null) return 1;
      if (b[field] == null) return -1;
      if (a[field]! > b[field]!) return reverse;
      if (a[field]! < b[field]!) return -reverse;
      return 0;
    });
  }

  addTenant(): void {
    this.router.navigate(['/configuration/tenant/add'], { queryParams: { status: 'Create' } });
  }

  modifyTenant(): void {
    if (this.selectedCount === 1 && this.selectedTenant && this.selectedTenant.tid !== '1') {
      const tenant = this.selectedTenant;
      this.router.navigate(['/configuration/tenant/add'], {
        queryParams: {
          status: 'Modify',
          tid: tenant.tid,
          name: tenant.name,
          description: tenant.description
        }
      });
    }
  }

  deleteTenant(): void {
    if (this.selectedCount === 0 || !confirm('Delete selected tenants?')) {
      return;
    }
    let xml = `<Sip><config><tenantList>`;
    this.tenantData.forEach(t => {
      if (t.selected) {
        xml += `<tenant><tid>${t.tid}</tid></tenant>`;
      }
    });
    xml += `</tenantList></config></Sip>`;

    this.soapService.executeDelete(xml).then(() => {
      this.init();
    });
  }

  edit(index: number): void {
    this.setClickedRow(index);
    this.modifyTenant();
  }
}
