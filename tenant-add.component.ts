// tenant-add.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SoapService } from '../../services/soap.service';
import { ConfigurationService } from '../../services/configuration.service';
import { GlobalService } from '../../services/global.service';
import { UtilitiesService } from '../../services/utilities.service';

@Component({
  selector: 'app-tenant-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-add.component.html',
  styleUrls: ['./tenant-add.component.css']
})
export class TenantAddComponent implements OnInit {
  tenant: any = {};
  modify: boolean = false;
  history: any[] = [];

  tid_valid: boolean = true;
  tid_title: string = '';
  tname_valid: boolean = true;
  tname_title: string = '';

  constructor(
    private router: Router,
    private soapUtils: SoapService,
    private configuration: ConfigurationService,
    private globalVariable: GlobalService,
    private utilities: UtilitiesService
  ) {}

  ngOnInit(): void {
    this.init();
  }

  init() {
    this.modify = this.configuration.tenant.status === 'Modify';
    this.tenant.id = this.configuration.tenant.tid;
    this.tenant.name = this.configuration.tenant.name;
    this.tenant.description = this.configuration.tenant.description;

    if (this.modify) {
      this.history.push({ ui: 'configuration.tenant_add', name: this.tenant.name });
    } else {
      this.history.push({ ui: 'configuration.tenant_add', name: 'Add Tenant' });
    }
  }

  async submitAddTenantForm() {
    // Validate tenant ID
    if (!this.tenant.id || this.tenant.id.toString().length === 0) {
      this.tid_valid = false;
      this.tid_title = 'This field is required';
      return;
    }

    if (this.tenant.id.toString().length > 10) {
      this.tid_valid = false;
      this.tid_title = 'ERROR: integer out of range';
      return;
    }

    if (Number(this.tenant.id) <= 1) {
      this.tid_valid = false;
      this.tid_title = 'Tenant ID should be a number greater than 1';
      return;
    }

    this.tid_valid = true;
    this.tid_title = '';
    this.tenant.id = '' + Number(this.tenant.id);

    const xml = `<Sip><config><tenantList><tenant><tid>${this.tenant.id}</tid></tenant></tenantList></config></Sip>`;

    try {
      if (this.configuration.tenant.status === 'Create' || this.configuration.tenant.status === 'Modify') {
        const data = await this.soapUtils.executeCommit(xml);

        if (this.configuration.tenant.status === 'Create') {
          const isUnique = data.Envelope.Body.isUniqueResponse.out;
          if (isUnique === '0') {
            this.tid_title = `Tenant ${this.tenant.id} already exists`;
            this.tid_valid = false;
            return;
          }
        }

        if (!this.tenant.name || this.tenant.name.length === 0) {
          this.tname_valid = false;
          this.tname_title = 'This field is required';
          return;
        }
      }

      // Nếu validate xong -> tạo tenant
      await this.createTenant();

    } catch (err) {
      console.error(err);
      this.utilities.displaySingleErrorDialog('Error connecting to server');
    }
  }

  async createTenant() {
    const xml = `<Sip><config><tenantList><tenant>
      <tid>${this.tenant.id}</tid>
      <name>${this.tenant.name}</name>
      <description>${this.tenant.description}</description>
    </tenant></tenantList></config></Sip>`;

    try {
      const data = await this.soapUtils.executeCommit(xml);

      if (data.Envelope.Body.Fault) {
        this.utilities.displaySingleErrorDialog(data.Envelope.Body.Fault.faultstring);
        return;
      }

      this.router.navigateByUrl('/configuration/tenant/list');

    } catch (err) {
      console.error(err);
      this.utilities.displaySingleErrorDialog('Error committing tenant');
    }
  }
}
