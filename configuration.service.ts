import { Injectable } from '@angular/core';

interface Tenant {
  tid?: string;
  name?: string;
  description?: string;
  status?: string;
  selected?: boolean;
}

interface GroupConfigData {
  original_assigned_groups: { group_name: string; data: any }[];
  tenant_list: Tenant[];
}

interface GroupConfig {
  name: string;
  status: 'Create' | 'Modify' | 'Copy';
  update: number;
  need_update: boolean;
  data: GroupConfigData;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  // === Các trang được chọn trong UI (từ AngularJS $rootScope.PAGES)
  PAGES = {
    FEATURE_CONFIGURATION: 'FEATURE_CONFIGURATION',
    CONFIGURATION_MENU_GROUPSANDUSERS: 'CONFIGURATION_MENU_GROUPSANDUSERS',
    CONFIGURATION_GROUPSANDUSERS_GROUPS: 'CONFIGURATION_GROUPSANDUSERS_GROUPS',
  };

  selectedFeature = '';
  selectedMenu = '';
  selectedConfigurationPage = '';

  // === Quản lý lịch sử điều hướng (để hiển thị breadcrumb)
  history: { ui: string; name: string }[] = [];

  // === Dữ liệu group (được dùng trực tiếp trong group-list.component)
  group: GroupConfig = {
    name: '',
    status: 'Create',
    update: 0,
    need_update: false,
    data: {
      original_assigned_groups: [],
      tenant_list: [],
    },
  };

  // === Dữ liệu tenant
  tenant = {
    tenant_list: [] as Tenant[],
    tid: '',
    name: '',
    description: '',
    status: 'Create',
  };

  // === Hàm tiện ích thiết lập page đang active (được gọi trong init())
  setActivePage(feature: string, menu: string, page: string): void {
    this.selectedFeature = feature;
    this.selectedMenu = menu;
    this.selectedConfigurationPage = page;
  }
}
